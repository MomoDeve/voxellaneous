mod constants;
mod utils;

use constants::{Vertex, CUBE_INDICES, CUBE_VERTICES};
use serde::Serialize;
use utils::map_wgpu_err;
use wasm_bindgen::prelude::*;
use wgpu::util::DeviceExt;

const MAX_INSTANCE_BUFFER_SIZE: usize = 32 * 4 * 1024 * 1024;
const MAX_MATERIAL_COUNT: usize = 128;

#[derive(Serialize)]
struct SerializableAdapterInfo {
    name: String,
    vendor: u32,
    device: u32,
    device_type: String,
    driver: String,
    driver_info: String,
    backend: String,
}

#[repr(C, align(16))]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    mvp_matrix: [f32; 16],
    material_colors: [[f32; 4]; MAX_MATERIAL_COUNT],
}

fn create_depth_texture(
    device: &wgpu::Device,
    config: &wgpu::SurfaceConfiguration,
    sample_count: u32,
) -> wgpu::TextureView {
    let size = wgpu::Extent3d {
        width: config.width,
        height: config.height,
        depth_or_array_layers: 1,
    };

    let depth_texture = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("Depth Texture"),
        size,
        mip_level_count: 1,
        sample_count: sample_count,
        dimension: wgpu::TextureDimension::D2,
        format: wgpu::TextureFormat::Depth24PlusStencil8, // Depth format
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,    // Used as a render target
        view_formats: &[],
    });

    depth_texture.create_view(&wgpu::TextureViewDescriptor::default())
}

fn create_miltisample_texture(
    device: &wgpu::Device,
    config: &wgpu::SurfaceConfiguration,
    sample_count: u32,
) -> wgpu::TextureView {
    let size = wgpu::Extent3d {
        width: config.width,
        height: config.height,
        depth_or_array_layers: 1,
    };

    let multisample_texture = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("Multisample Texture"),
        size,
        mip_level_count: 1,
        sample_count,
        dimension: wgpu::TextureDimension::D2,
        format: config.format,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
        view_formats: &[],
    });

    multisample_texture.create_view(&wgpu::TextureViewDescriptor::default())
}

#[wasm_bindgen]
pub struct Renderer {
    device: wgpu::Device,
    queue: wgpu::Queue,
    adapter_info: wgpu::AdapterInfo,
    surface: wgpu::Surface<'static>,
    surface_config: wgpu::SurfaceConfiguration,
    render_pipeline: wgpu::RenderPipeline,
    vertex_buffer: wgpu::Buffer,
    index_buffer: wgpu::Buffer,
    instance_buffer: wgpu::Buffer,
    uniform_buffer: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
    multisample_texture_view: wgpu::TextureView,
    depth_texture_view: wgpu::TextureView,
    sample_count: u32,

    map_size: usize,
    material_colors: Vec<[f32; 4]>,
}

#[wasm_bindgen]
impl Renderer {
    pub async fn new(html_canvas: web_sys::HtmlCanvasElement) -> Result<Renderer, JsValue> {
        // Initialize the GPU
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::default());

        let canvas_width = html_canvas.width();
        let canvas_height = html_canvas.height();
        let sample_count = 4;

        let surface_target = wgpu::SurfaceTarget::Canvas(html_canvas);
        let surface = instance
            .create_surface(surface_target)
            .map_err(map_wgpu_err)?;

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                force_fallback_adapter: false,
            })
            .await
            .ok_or("Failed to find a suitable GPU adapter")?;

        let adapter_info = adapter.get_info();

        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor::default(), None)
            .await
            .map_err(map_wgpu_err)?;

        let supported_formats = surface.get_capabilities(&adapter).formats;
        let surface_format = *supported_formats.first().unwrap();

        let surface_config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface_format,
            width: canvas_width,
            height: canvas_height,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: wgpu::CompositeAlphaMode::Auto,
            desired_maximum_frame_latency: 2,
            view_formats: vec![],
        };
        surface.configure(&device, &surface_config);

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("shaders/shader.wgsl").into()),
        });

        let vertex_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Vertex Buffer"),
            contents: bytemuck::cast_slice(CUBE_VERTICES),
            usage: wgpu::BufferUsages::VERTEX,
        });

        let index_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Index Buffer"),
            contents: bytemuck::cast_slice(CUBE_INDICES),
            usage: wgpu::BufferUsages::INDEX,
        });

        let uniform_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Uniform Buffer"),
            contents: &[0; std::mem::size_of::<Uniforms>()],
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        let instance_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Position Buffer"),
            contents: &[0; MAX_INSTANCE_BUFFER_SIZE],
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
        });

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("Bind Group Layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::VERTEX,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::VERTEX,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: uniform_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: instance_buffer.as_entire_binding(),
                },
            ],
            label: Some("Bind Group"),
        });

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Pipeline Layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        let render_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("Render Pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &[wgpu::VertexBufferLayout {
                    array_stride: std::mem::size_of::<Vertex>() as wgpu::BufferAddress,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &wgpu::vertex_attr_array![0 => Float32x3, 1 => Float32x2],
                }],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs_main",
                targets: &[Some(wgpu::ColorTargetState {
                    format: surface_format,
                    blend: Some(wgpu::BlendState::REPLACE),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            }),
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth24PlusStencil8,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: wgpu::StencilState::default(),
                bias: wgpu::DepthBiasState::default(),
            }),
            primitive: wgpu::PrimitiveState::default(),
            multisample: wgpu::MultisampleState {
                count: sample_count,
                mask: !0,
                alpha_to_coverage_enabled: false,
            },
            multiview: None,
            cache: None,
        });

        let multisample_texture_view =
            create_miltisample_texture(&device, &surface_config, sample_count);
        let depth_texture_view = create_depth_texture(&device, &surface_config, sample_count);

        Ok(Renderer {
            device,
            queue,
            adapter_info,
            surface,
            render_pipeline,
            vertex_buffer,
            index_buffer,
            uniform_buffer,
            instance_buffer,
            bind_group,
            sample_count,
            multisample_texture_view,
            depth_texture_view,
            surface_config,
            map_size: 0,
            material_colors: vec![[0.0; 4]; MAX_MATERIAL_COUNT],
        })
    }

    pub fn resize(&mut self, width: u32, height: u32) -> Result<(), JsValue> {
        self.surface_config.width = width;
        self.surface_config.height = height;
        self.surface.configure(&self.device, &self.surface_config);
        self.multisample_texture_view =
            create_miltisample_texture(&self.device, &self.surface_config, self.sample_count);
        self.depth_texture_view =
            create_depth_texture(&self.device, &self.surface_config, self.sample_count);
        Ok(())
    }

    pub fn render(&mut self, mvp_matrix: &[f32]) -> Result<(), JsValue> {
        let mvp_matrix = mvp_matrix
            .try_into()
            .expect("mvp_matrix has incorrect length");
        let uniforms = Uniforms {
            mvp_matrix,
            material_colors: self.material_colors.clone().try_into().unwrap(),
        };

        self.queue
            .write_buffer(&self.uniform_buffer, 0, bytemuck::cast_slice(&[uniforms]));

        let frame = self
            .surface
            .get_current_texture()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let view = frame
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());

        // Create a command encoder for the render pass
        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("Render Encoder"),
            });

        // Begin render pass
        if self.map_size > 0 {
            let clear_color = wgpu::Color {
                r: 0.53,
                g: 0.81,
                b: 0.92,
                a: 1.0,
            };

            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &self.multisample_texture_view,
                    resolve_target: Some(&view),
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(clear_color),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                    view: &self.depth_texture_view,
                    depth_ops: Some(wgpu::Operations {
                        load: wgpu::LoadOp::Clear(1.0),
                        store: wgpu::StoreOp::Discard,
                    }),
                    stencil_ops: None,
                }),
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            // Bind pipeline, vertex buffer, index buffer, and uniforms
            render_pass.set_pipeline(&self.render_pipeline);
            render_pass.set_bind_group(0, &self.bind_group, &[]);
            render_pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
            render_pass.set_index_buffer(self.index_buffer.slice(..), wgpu::IndexFormat::Uint16);

            render_pass.draw_indexed(0..36, 0, 0..self.map_size as u32);
        }

        // Submit the commands to the GPU
        self.queue.submit(Some(encoder.finish()));
        frame.present();

        Ok(())
    }

    pub fn get_gpu_info(&self) -> JsValue {
        let gpu_info = SerializableAdapterInfo {
            name: self.adapter_info.name.clone(),
            vendor: self.adapter_info.vendor,
            device: self.adapter_info.device,
            device_type: format!("{:?}", self.adapter_info.device_type),
            driver: self.adapter_info.driver_info.clone(),
            driver_info: self.adapter_info.driver_info.clone(),
            backend: format!("{:?}", self.adapter_info.backend),
        };
        serde_wasm_bindgen::to_value(&gpu_info).unwrap()
    }

    pub fn upload_map(&mut self, map: Vec<f32>) -> Result<(), JsValue> {
        assert_eq!(map.len() % 4, 0); // verify vec4 alignment
        self.queue
            .write_buffer(&self.instance_buffer, 0, bytemuck::cast_slice(&map));
        self.map_size = map.len() / 4;
        Ok(())
    }

    pub fn upload_materials(&mut self, material_colors: &[f32]) -> Result<(), JsValue> {
        assert_eq!(material_colors.len() % 4, 0); // verify vec4 alignment
        assert!(material_colors.len() / 4 < MAX_MATERIAL_COUNT); // verify max material count

        self.material_colors = material_colors
            .chunks(4)
            .map(|c| c.try_into().expect("material_colors has incorrect length"))
            .collect();
        if (self.material_colors.len() * 4) < MAX_MATERIAL_COUNT {
            self.material_colors.resize(MAX_MATERIAL_COUNT, [0.0; 4]);
        }

        Ok(())
    }
}


struct VertexInput {
    @location(0) position: vec3<f32>,
    @builtin(instance_index) instance_id: u32,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
};

struct Uniforms {
    mvp_matrix: mat4x4<f32>,
    material_colors: array<vec4<f32>, 128>,
};

struct Instances {
    data: array<vec4<f32>>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> instances: Instances;


@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let instance_position = instances.data[input.instance_id].xyz;
    let instance_material_index = u32(instances.data[input.instance_id].w);

    output.position = uniforms.mvp_matrix * vec4<f32>(input.position + instance_position, 1.0);
    output.color = uniforms.material_colors[instance_material_index];
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.color;
}

struct VertexInput {
    @location(0) position: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) world_position: vec3<f32>,
};

struct PerFrameUniforms {
    vp_matrix: mat4x4<f32>,
    view_position: vec3<f32>,
    _padding: f32,
};

struct StaticUniforms {
    color_palette: array<vec4<u32>, 64>,
};

struct PerDrawUniforms {
    model_matrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> static_uniforms: StaticUniforms;
@group(1) @binding(0) var<uniform> per_frame_uniforms: PerFrameUniforms;
@group(2) @binding(0) var voxel_texture: texture_3d<u32>;
@group(2) @binding(1) var<uniform> per_draw_uniforms: PerDrawUniforms;

fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32((color >> 24) & 0xFFu) / 255.0;
    let g = f32((color >> 16) & 0xFFu) / 255.0;
    let b = f32((color >>  8) & 0xFFu) / 255.0;
    let a = f32((color      ) & 0xFFu) / 255.0;
    return vec4<f32>(r, g, b, a);
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let local_position = per_draw_uniforms.model_matrix * vec4<f32>(input.position, 1.0);
    out.position = per_frame_uniforms.vp_matrix * vec4<f32>(local_position.xyz, 1.0);
    out.world_position = local_position.xyz;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let uvw = in.world_position * 0.5 + vec3<f32>(0.5);

    let dims: vec3<u32> = textureDimensions(voxel_texture, 0);
    let coord = vec3<u32>(uvw * vec3<f32>(f32(dims.x), f32(dims.y), f32(dims.z)));

    let idx: u32 = textureLoad(voxel_texture, coord, 0).r;
    let base_pallete_idx = idx / 4u;
    let comp_pallete_idx = idx % 4u;

    let packed_color = static_uniforms.color_palette[base_pallete_idx][comp_pallete_idx];
    let base_color = unpack_color(packed_color);

    let V = normalize(per_frame_uniforms.view_position - in.world_position);

    let p = in.world_position;
    let ax = abs(p.x);
    let ay = abs(p.y);
    let az = abs(p.z);

    var N: vec3<f32>;
    if (ax > ay && ax > az) {
        N = vec3<f32>(sign(p.x), 0.0, 0.0);
    } else if (ay > az) {
        N = vec3<f32>(0.0, sign(p.y), 0.0);
    } else {
        N = vec3<f32>(0.0, 0.0, sign(p.z));
    }

    let ambient = 0.2;
    let diff = abs(dot(N, V));
    let lighting = ambient + (1.0 - ambient) * diff;

    return vec4<f32>(base_color.rgb * lighting, base_color.a);
}
struct VertexInput {
    @location(0) position: vec3<f32>,  // in object space [-0.5,0.5]^3
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) obj_pos: vec3<f32>,   // object‑space position
};

struct PerFrameUniforms {
    vp_matrix:  mat4x4<f32>,
    cam_pos_ws: vec3<f32>,
    _padding:   f32,
};
@group(1) @binding(0) var<uniform> u_frame: PerFrameUniforms;

struct StaticUniforms {
    palette: array<vec4<u32>, 64>,
};
@group(0) @binding(0) var<uniform> u_static: StaticUniforms;

struct PerDrawUniforms {
    model_matrix:     mat4x4<f32>,
    inv_model_matrix: mat4x4<f32>,
};
@group(2) @binding(1) var<uniform> u_draw: PerDrawUniforms;

@group(2) @binding(0) var voxel_texture: texture_3d<u32>;

// unpack 0xRRGGBBAA
fn unpack_color(p: u32) -> vec4<f32> {
    return vec4<f32>(
        f32((p >> 24) & 0xFFu) / 255.0,
        f32((p >> 16) & 0xFFu) / 255.0,
        f32((p >>  8) & 0xFFu) / 255.0,
        f32((p      ) & 0xFFu) / 255.0
    );
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let ws4 = u_draw.model_matrix * vec4<f32>(in.position, 1.0);
    out.position = u_frame.vp_matrix * ws4;
    out.obj_pos  = in.position;
    return out;
}

struct GBuffer {
    @location(0) albedo: vec4<f32>,   // Rgba16Uint
    @location(1) normal: vec4<f32>,   // Rgba8Unorm
    @location(2) linear_z: u32,       // R16Uint
};

@fragment
fn fs_main(in: VertexOutput) -> GBuffer {
    // --- ray‑march to first non‑empty voxel (as before) ---
    let cam_os  = (u_draw.inv_model_matrix * vec4<f32>(u_frame.cam_pos_ws, 1.0)).xyz;
    let dir     = normalize(in.obj_pos - cam_os);

    // compute t_max for [-0.5,0.5]^3...
    var t_max = 1e6;
    if (dir.x != 0.0) {
        let t1 = (-0.5 - cam_os.x) / dir.x;
        let t2 = ( 0.5 - cam_os.x) / dir.x;
        t_max = min(t_max, max(t1, t2));
    }
    if (dir.y != 0.0) {
        let t1 = (-0.5 - cam_os.y) / dir.y;
        let t2 = ( 0.5 - cam_os.y) / dir.y;
        t_max = min(t_max, max(t1, t2));
    }
    if (dir.z != 0.0) {
        let t1 = (-0.5 - cam_os.z) / dir.z;
        let t2 = ( 0.5 - cam_os.z) / dir.z;
        t_max = min(t_max, max(t1, t2));
    }

    let STEPS: u32 = 64u;
    let dt = t_max / f32(STEPS);
    var t: f32 = 0.0;
    var hit_pos = vec3<f32>(0.0);
    var hit_idx: u32 = 0u;
    for (var i: u32 = 0u; i < STEPS; i = i + 1u) {
        let p = cam_os + dir * t;
        let uvw = clamp(p + vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(1.0));
        let dims = textureDimensions(voxel_texture, 0);
        let coord = vec3<u32>(
            u32(uvw.x * f32(dims.x)),
            u32(uvw.y * f32(dims.y)),
            u32(uvw.z * f32(dims.z))
        );
        let idx = textureLoad(voxel_texture, coord, 0).r;
        if (idx != 0u) {
            hit_pos = p;
            hit_idx = idx;
            break;
        }
        t = t + dt;
    }

    // If no hit, we can return transparent / default values
    if (hit_idx == 0u) {
        discard;
    }

    // --- Albedo ---
    let packed   = u_static.palette[hit_idx / 4u][hit_idx % 4u];
    let albedo   = unpack_color(packed);

     // --- Normal (flat), remapped [–1,1]→[0,1] for Rgba8Unorm ---
    let abs_p = abs(hit_pos);
    var N = vec3<f32>(0.0);
    if (abs_p.x > abs_p.y && abs_p.x > abs_p.z) {
        N = vec3<f32>(sign(hit_pos.x), 0.0, 0.0);
    } else if (abs_p.y > abs_p.z) {
        N = vec3<f32>(0.0, sign(hit_pos.y), 0.0);
    } else {
        N = vec3<f32>(0.0, 0.0, sign(hit_pos.z));
    }
    // remap and pack into [0,1]
    let normal = vec4<f32>(N * 0.5 + vec3<f32>(0.5), 1.0);

    // --- Linear Z and Inverse Z ---
    // camera‑space depth: project hit_pos to clip then derive view‑space Z
    // but approximate view‑space Z as distance
    let view_space_z = length((u_draw.model_matrix * vec4<f32>(hit_pos,1)).xyz - u_frame.cam_pos_ws);
    // linear Z (0..max) mapped to uint16
    let lin_z_u16 = u32(clamp(view_space_z / 100.0, 0.0, 1.0) * 65535.0);

    return GBuffer(
        albedo,
        normal,
        lin_z_u16,
    );
}
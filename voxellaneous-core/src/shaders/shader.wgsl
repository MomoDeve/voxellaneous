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

// G‑buffer outputs: albedo, normal, linear depth
struct GBuffer {
    @location(0) albedo:    vec4<f32>, // Rgba8Unorm
    @location(1) normal:    vec4<f32>, // Rgba8Unorm encoded
    @location(2) linear_z:  u32,       // R16Uint
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let ws4 = u_draw.model_matrix * vec4<f32>(in.position, 1.0);
    out.position = u_frame.vp_matrix * ws4;
    out.obj_pos  = in.position;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> GBuffer {
    let cam_os = (u_draw.inv_model_matrix * vec4<f32>(u_frame.cam_pos_ws, 1.0)).xyz;
    let dir_os = normalize(in.obj_pos - cam_os);

    let dims = vec3<u32>(textureDimensions(voxel_texture, 0));
    let dims_f = vec3<f32>(dims);

    // Clamp near-zero components to prevent instability
    let safe_dir = max(abs(dir_os), vec3<f32>(1e-4));
    let inv_dir = sign(dir_os) / safe_dir;

    let bounds_min = vec3<f32>(-0.5);
    let bounds_max = vec3<f32>(0.5);
    let tmin = (bounds_min - cam_os) * inv_dir;
    let tmax = (bounds_max - cam_os) * inv_dir;

    let t_entry = max(max(min(tmin.x, tmax.x), min(tmin.y, tmax.y)), min(tmin.z, tmax.z));
    let t_exit  = min(min(max(tmin.x, tmax.x), max(tmin.y, tmax.y)), max(tmin.z, tmax.z));

    if t_exit < 0.0 || t_entry > t_exit {
        discard;
    }

    var t = max(t_entry, 0.0);
    let offset = dir_os * 1e-4;
    var pos = (cam_os + dir_os * t + vec3<f32>(0.5)) * dims_f + offset;
    var voxel = vec3<i32>(floor(pos));

    let step = vec3<i32>(select(vec3<f32>(-1.0), vec3<f32>(1.0), dir_os > vec3<f32>(0.0)));

    let voxel_f = vec3<f32>(voxel);
    let next_boundary = voxel_f + select(vec3<f32>(0.0), vec3<f32>(1.0), dir_os > vec3<f32>(0.0));
    var t_max = (next_boundary - pos) * inv_dir;
    let t_delta = abs(inv_dir);

    var hit_idx = 0u;
    var hit_voxel = vec3<u32>(0u);
    var hit_t = 0.0;
    var hit_normal = vec3<f32>(0.0);
    var last_axis = 0;

    let MAX_STEPS = 256u;
    for (var i = 0u; i < MAX_STEPS; i = i + 1u) {
        if any(voxel < vec3<i32>(0)) || any(voxel >= vec3<i32>(dims)) {
            break;
        }

        let coord = vec3<u32>(voxel);
        let idx = textureLoad(voxel_texture, coord, 0).r;

        if idx != 0u {
            hit_idx = idx;
            hit_voxel = coord;
            hit_t = t;

            if last_axis == 0 {
                hit_normal = vec3<f32>(-f32(step.x), 0.0, 0.0);
            } else if last_axis == 1 {
                hit_normal = vec3<f32>(0.0, -f32(step.y), 0.0);
            } else {
                hit_normal = vec3<f32>(0.0, 0.0, -f32(step.z));
            }

            break;
        }

        if t_max.x < t_max.y && t_max.x < t_max.z {
            voxel.x += step.x;
            t = t_max.x;
            t_max.x += t_delta.x;
            last_axis = 0;
        } else if t_max.y < t_max.z {
            voxel.y += step.y;
            t = t_max.y;
            t_max.y += t_delta.y;
            last_axis = 1;
        } else {
            voxel.z += step.z;
            t = t_max.z;
            t_max.z += t_delta.z;
            last_axis = 2;
        }
    }

    if hit_idx == 0u {
        discard;
    }

    let hit_pos_os = cam_os + hit_t * dir_os;
    let hit_pos_ws = (u_draw.model_matrix * vec4<f32>(hit_pos_os, 1.0)).xyz;

    let packed = u_static.palette[hit_idx / 4u][hit_idx % 4u];
    let albedo = unpack4x8unorm(packed);

    let linear_z = length(hit_pos_ws - u_frame.cam_pos_ws);
    return GBuffer(
        albedo,
        vec4<f32>(hit_normal * 0.5 + 0.5, 1.0),
        u32(clamp(linear_z / 100.0, 0.0, 1.0) * 65535.0)
    );
}
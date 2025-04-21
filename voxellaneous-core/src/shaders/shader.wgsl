struct VertexInput {
    @location(0) position: vec3<f32>,  // in object space [-0.5,0.5]^3
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) obj_pos: vec3<f32>,   // still in object space
};

struct PerFrameUniforms {
    vp_matrix: mat4x4<f32>,
    cam_pos_ws: vec3<f32>,
    _padding: f32,
};

struct StaticUniforms {
    palette: array<vec4<u32>, 64>,
};

struct PerDrawUniforms {
    model_matrix: mat4x4<f32>,
    inv_model_matrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> u_static: StaticUniforms;
@group(1) @binding(0) var<uniform> u_frame: PerFrameUniforms;
@group(2) @binding(0) var voxel_texture: texture_3d<u32>;
@group(2) @binding(1) var<uniform> u_draw: PerDrawUniforms;

fn unpack_color(color: u32) -> vec4<f32> {
    let r = f32((color >> 24) & 0xFFu) / 255.0;
    let g = f32((color >> 16) & 0xFFu) / 255.0;
    let b = f32((color >>  8) & 0xFFu) / 255.0;
    let a = f32((color      ) & 0xFFu) / 255.0;
    return vec4<f32>(r, g, b, a);
}

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let ws4 = u_draw.model_matrix * vec4<f32>(in.position, 1.0);
    out.position = u_frame.vp_matrix * ws4;
    out.obj_pos  = in.position;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // 1) ray origin & dir in object space
    let cam_pos = (u_draw.inv_model_matrix * vec4<f32>(u_frame.cam_pos_ws, 1.0)).xyz;
    let ray_dir = normalize(in.obj_pos - cam_pos);

    // 2) compute exit t_max for [-0.5,0.5]^3
    var t_max = 1e6;
    if (ray_dir.x != 0.0) {
        let t1 = (-0.5 - cam_pos.x) / ray_dir.x;
        let t2 = ( 0.5 - cam_pos.x) / ray_dir.x;
        t_max = min(t_max, max(t1, t2));
    }
    if (ray_dir.y != 0.0) {
        let t1 = (-0.5 - cam_pos.y) / ray_dir.y;
        let t2 = ( 0.5 - cam_pos.y) / ray_dir.y;
        t_max = min(t_max, max(t1, t2));
    }
    if (ray_dir.z != 0.0) {
        let t1 = (-0.5 - cam_pos.z) / ray_dir.z;
        let t2 = ( 0.5 - cam_pos.z) / ray_dir.z;
        t_max = min(t_max, max(t1, t2));
    }

    let STEPS: u32 = 64u;
    let dt = t_max / f32(STEPS);
    var t: f32 = 0.0;
    for (var i: u32 = 0u; i < STEPS; i = i + 1u) {
        let ray_pos = cam_pos + ray_dir * t;

        // map [-0.5,0.5]→[0,1]
        let uvw = clamp(ray_pos + vec3<f32>(0.5), vec3<f32>(0.0), vec3<f32>(1.0));

        // fetch voxel index
        let dims  = textureDimensions(voxel_texture, 0);
        let coord = vec3<u32>(
            u32(uvw.x * f32(dims.x)),
            u32(uvw.y * f32(dims.y)),
            u32(uvw.z * f32(dims.z)),
        );
        let idx = textureLoad(voxel_texture, coord, 0).r;
        if (idx != 0u) {
            // unpack and shade
            let packed    = u_static.palette[idx / 4u][idx % 4u];
            let base_color  = unpack_color(packed);
            return base_color;
        }
        t = t + dt;
    }

    discard;
    return vec4<f32>(0.0); // never reached
}
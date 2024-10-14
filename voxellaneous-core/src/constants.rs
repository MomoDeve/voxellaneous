#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
pub struct Vertex {
    position: [f32; 3],
    uv: [f32; 2],
}

pub const CUBE_VERTICES: &[Vertex] = &[
    Vertex {
        position: [-0.5, -0.5, 0.5],
        uv: [0.0, 0.0],
    }, // Bottom-left
    Vertex {
        position: [0.5, -0.5, 0.5],
        uv: [1.0, 0.0],
    }, // Bottom-right
    Vertex {
        position: [0.5, 0.5, 0.5],
        uv: [1.0, 1.0],
    }, // Top-right
    Vertex {
        position: [-0.5, 0.5, 0.5],
        uv: [0.0, 1.0],
    }, // Top-left
    // Back face
    Vertex {
        position: [-0.5, -0.5, -0.5],
        uv: [1.0, 0.0],
    }, // Bottom-right
    Vertex {
        position: [0.5, -0.5, -0.5],
        uv: [0.0, 0.0],
    }, // Bottom-left
    Vertex {
        position: [0.5, 0.5, -0.5],
        uv: [0.0, 1.0],
    }, // Top-left
    Vertex {
        position: [-0.5, 0.5, -0.5],
        uv: [1.0, 1.0],
    }, // Top-right
    // Top face
    Vertex {
        position: [-0.5, 0.5, -0.5],
        uv: [0.0, 0.0],
    }, // Bottom-left
    Vertex {
        position: [0.5, 0.5, -0.5],
        uv: [1.0, 0.0],
    }, // Bottom-right
    Vertex {
        position: [0.5, 0.5, 0.5],
        uv: [1.0, 1.0],
    }, // Top-right
    Vertex {
        position: [-0.5, 0.5, 0.5],
        uv: [0.0, 1.0],
    }, // Top-left
    // Bottom face
    Vertex {
        position: [-0.5, -0.5, -0.5],
        uv: [0.0, 1.0],
    }, // Top-left
    Vertex {
        position: [0.5, -0.5, -0.5],
        uv: [1.0, 1.0],
    }, // Top-right
    Vertex {
        position: [0.5, -0.5, 0.5],
        uv: [1.0, 0.0],
    }, // Bottom-right
    Vertex {
        position: [-0.5, -0.5, 0.5],
        uv: [0.0, 0.0],
    }, // Bottom-left
    // Right face
    Vertex {
        position: [0.5, -0.5, -0.5],
        uv: [0.0, 0.0],
    }, // Bottom-left
    Vertex {
        position: [0.5, 0.5, -0.5],
        uv: [1.0, 0.0],
    }, // Top-left
    Vertex {
        position: [0.5, 0.5, 0.5],
        uv: [1.0, 1.0],
    }, // Top-right
    Vertex {
        position: [0.5, -0.5, 0.5],
        uv: [0.0, 1.0],
    }, // Bottom-right
    // Left face
    Vertex {
        position: [-0.5, -0.5, -0.5],
        uv: [1.0, 0.0],
    }, // Bottom-right
    Vertex {
        position: [-0.5, 0.5, -0.5],
        uv: [0.0, 0.0],
    }, // Top-right
    Vertex {
        position: [-0.5, 0.5, 0.5],
        uv: [0.0, 1.0],
    }, // Top-left
    Vertex {
        position: [-0.5, -0.5, 0.5],
        uv: [1.0, 1.0],
    }, // Bottom-left
];

pub const CUBE_INDICES: &[u16] = &[
    // Front face
    0, 1, 2, 0, 2, 3, // Back face
    4, 5, 6, 4, 6, 7, // Top face
    8, 9, 10, 8, 10, 11, // Bottom face
    12, 13, 14, 12, 14, 15, // Right face
    16, 17, 18, 16, 18, 19, // Left face
    20, 21, 22, 20, 22, 23,
];

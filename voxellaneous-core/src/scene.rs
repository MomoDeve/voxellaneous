use serde::{Deserialize, Serialize};

use crate::primitives::RGBA;

/// A voxel object: an 8×8×8 grid of palette indices.
#[derive(Serialize, Deserialize)]
pub struct VoxelObject {
    pub id: String,
    pub model_matrix: [f32; 16],
    pub inv_model_matrix: [f32; 16],
    pub dims: [u32; 3],
    pub voxels: Vec<u8>,
}

/// The scene containing a shared palette and multiple voxel objects.
#[derive(Serialize, Deserialize)]
pub struct Scene {
    pub palette: Vec<RGBA>,
    pub objects: Vec<VoxelObject>,
}

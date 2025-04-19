use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct RGBA(pub u8, pub u8, pub u8, pub u8);
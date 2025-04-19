use wasm_bindgen::JsValue;

use crate::primitives::RGBA;

// e should accept any type which has to_string method
pub fn map_wgpu_err(e: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&e.to_string())
}

pub fn pack_rgba(rgba: &RGBA) -> u32 {
    ((rgba.0 as u32) << 24) | ((rgba.1 as u32) << 16) | ((rgba.2 as u32) << 8) | (rgba.3 as u32)
}

use wasm_bindgen::JsValue;

// e should accept any type which has to_string method
pub fn map_wgpu_err(e: impl std::fmt::Display) -> JsValue {
    JsValue::from_str(&e.to_string())
}

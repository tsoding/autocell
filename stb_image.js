"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STB_IMAGE_WASM_PATH = "wasm/stb_image.wasm";
const stb_image_raw = WebAssembly.instantiateStreaming(fetch(STB_IMAGE_WASM_PATH), {
    env: {},
}).then((w) => {
    const memory = w.instance.exports.memory;
    // TODO: grow the memory automatically as needed
    memory.grow(10);
    return {
        "memory": memory,
        "stbi_load_from_memory": w.instance.exports.stbi_load_from_memory,
        "malloc": w.instance.exports.malloc,
        "heap_reset": w.instance.exports.heap_reset,
    };
});
function stbi_load_from_arraybuffer(arrayBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = new Uint8Array(yield arrayBuffer);
        const stb_image = yield stb_image_raw;
        // TODO: maybe we should expose all of this memory management to the user so we don't have to do the copy below
        stb_image.heap_reset();
        const len = buffer.length;
        const buf = stb_image.malloc(len);
        new Uint8Array(stb_image.memory.buffer, buf, len).set(buffer);
        const x = stb_image.malloc(4);
        const y = stb_image.malloc(4);
        const pixels = stb_image.stbi_load_from_memory(buf, len, x, y, 0, 4);
        const w = new Uint32Array(stb_image.memory.buffer, x, 1)[0];
        const h = new Uint32Array(stb_image.memory.buffer, y, 1)[0];
        const imageData = new Uint8ClampedArray(w * h * 4);
        // Copying the image data cause the next call to stb_image.heap_reset() above will erase it.
        imageData.set(new Uint8ClampedArray(stb_image.memory.buffer, pixels, w * h * 4));
        return new ImageData(imageData, w);
    });
}
function stbi_load_from_url(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(url);
        return stbi_load_from_arraybuffer(response.arrayBuffer());
    });
}
//# sourceMappingURL=stb_image.js.map
const STB_IMAGE_WASM_PATH = "wasm/stb_image.wasm";

type pointer = number;

type stbi_load_from_memory_type = (buf: pointer, len: number, x: number, y: number, channels_in_file: pointer, desired_channels: number) => pointer;
type malloc_type = (s: number) => pointer;
type heap_reset_type = () => void;

interface Stb_Image_Raw {
    stbi_load_from_memory: stbi_load_from_memory_type;
    malloc: malloc_type;
    heap_reset: heap_reset_type;
    memory: WebAssembly.Memory;
}

const stb_image_raw: Promise<Stb_Image_Raw> = WebAssembly.instantiateStreaming(fetch(STB_IMAGE_WASM_PATH), {
    env: {},
}).then((w) => {
    const memory = w.instance.exports.memory as WebAssembly.Memory;
    // TODO: grow the memory automatically as needed
    memory.grow(10);
    return {
        "memory": memory,
        "stbi_load_from_memory": w.instance.exports.stbi_load_from_memory as stbi_load_from_memory_type,
        "malloc": w.instance.exports.malloc as malloc_type,
        "heap_reset": w.instance.exports.heap_reset as heap_reset_type,
    };
});

async function stbi_load_from_arraybuffer(arrayBuffer: ArrayBuffer | Promise<ArrayBuffer>): Promise<ImageData> {
    const buffer = new Uint8Array(await arrayBuffer);
    const stb_image = await stb_image_raw;
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
    const imageData = new Uint8ClampedArray(w*h*4);
    // Copying the image data cause the next call to stb_image.heap_reset() above will erase it.
    imageData.set(new Uint8ClampedArray(stb_image.memory.buffer, pixels, w*h*4));
    return new ImageData(imageData, w);
}

async function stbi_load_from_url(url: RequestInfo): Promise<ImageData> {
    const response = await fetch(url);
    return stbi_load_from_arraybuffer(response.arrayBuffer());
}

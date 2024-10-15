import { Noise } from 'noisejs';

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Initialize the Perlin noise generator
const noise = new Noise(Math.random());

function perlinNoise(x: number, z: number, scale: number, amplitude: number): number {
    return noise.perlin2(x * scale, z * scale) * amplitude;
}


export function generateTerrainMap(): number[] {
    const xSize = 1024;
    const zSize = 1024;
    const vecSize = 4;

    const map = new Array(xSize * zSize * vecSize);

    const noiseScales = [0.5, 0.01, 0.002];  
    const noiseAmplitudes = [1.0, 10.0, 200.0];

    for (let xIdx = 0; xIdx < xSize; xIdx++) {
        for (let zIdx = 0; zIdx < zSize; zIdx++) {
           const offset = (xIdx * zSize + zIdx) * vecSize;

            const height = noiseScales.reduce((acc, scale, idx) => acc + perlinNoise(xIdx, zIdx, scale, noiseAmplitudes[idx]), 0)

            const materialId = Math.min(Math.floor(Math.abs(height)/ 15), 5);

            map[offset + 0] = xIdx;
            map[offset + 1] = height;
            map[offset + 2] = zIdx;
            map[offset + 3] = getRandomInt(materialId, materialId + 2);
        }
    }
    return map;
}
// @ts-ignore
import { Noise } from 'noisejs';

type NoiseParamList = [number, number, number, number];

export const NoiseParams = {
    scales: [0.001, 0.005, 0.01, 0.002] as NoiseParamList,
    amplitudes: [100.0, 10.0, 50.0, 200.0] as NoiseParamList,
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Initialize the Perlin noise generator
let noise = new Noise(Math.random());

function perlinNoise(x: number, z: number, scale: number, amplitude: number): number {
    return noise.perlin2(x * scale, z * scale) * amplitude;
}


export function generateTerrainMap(seed?: number): number[] {
    const xSize = 1024;
    const zSize = 1024;
    const vecSize = 4;

    if (seed !== undefined) {
        noise = new Noise(seed);
    }

    const map = new Array(xSize * zSize * vecSize);

    for (let xIdx = 0; xIdx < xSize; xIdx++) {
        for (let zIdx = 0; zIdx < zSize; zIdx++) {
           const offset = (xIdx * zSize + zIdx) * vecSize;

            const height = NoiseParams.scales.reduce((acc, scale, idx) => acc + perlinNoise(xIdx, zIdx, scale, NoiseParams.amplitudes[idx]), 0)
            const materialId = Math.min(Math.floor(Math.abs(height)/ 15), 5);

            map[offset + 0] = xIdx;
            map[offset + 1] = height;
            map[offset + 2] = zIdx;
            map[offset + 3] = getRandomInt(materialId, materialId + 2);
        }
    }
    return map;
}
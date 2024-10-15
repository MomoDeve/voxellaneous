function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateTerrainMap(): number[] {
    const xSize = 1024;
    const zSize = 1024;
    const vecSize = 4;

    const map = new Array(xSize * zSize * vecSize);
    for (let xIdx = 0; xIdx < xSize; xIdx++) {
        for (let zIdx = 0; zIdx < zSize; zIdx++) {
           const offset = (xIdx * zSize + zIdx) * vecSize;
            map[offset + 0] = xIdx;
            map[offset + 1] = 2.0 * Math.sin(xIdx / 2) * Math.cos(zIdx / 2);
            map[offset + 2] = zIdx;
            map[offset + 3] = getRandomInt(0, 7);
        }
    }
    return map;
}
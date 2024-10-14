export function generateTerrainMap(): number[] {
    const xSize = 20;
    const zSize = 20;
    const vecSize = 4;

    const map = new Array(xSize * zSize * vecSize);
    for (let xIdx = 0; xIdx < xSize; xIdx++) {
        for (let zIdx = 0; zIdx < zSize; zIdx++) {
           const offset = (xIdx * zSize + zIdx) * vecSize;
            map[offset + 0] = xIdx;
            map[offset + 1] = Math.sin(xIdx / 2) * Math.cos(zIdx / 2);
            map[offset + 2] = zIdx;
            map[offset + 3] = 0;
        }
    }
    return map;
}
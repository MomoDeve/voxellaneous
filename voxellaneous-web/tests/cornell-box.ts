import { mat4, vec3 } from 'gl-matrix';
import { Scene } from '../src/scene';

function createUniformVoxelData([nx, ny, nz]: [number, number, number], paletteIndex: number): Uint8Array {
  const total = nx * ny * nz;
  const voxels = new Uint8Array(total);
  voxels.fill(paletteIndex);
  return voxels;
}

function createSphereVoxelData([nx, ny, nz]: [number, number, number], paletteIndex: number): Uint8Array {
  const voxels = new Uint8Array(nx * ny * nz);
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  const cz = (nz - 1) / 2;
  const radius = Math.min(nx, ny, nz) * 0.5 * 0.9;
  const r2 = radius * radius;

  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dz = z - cz;
        if (dx * dx + dy * dy + dz * dz <= r2) {
          voxels[x + nx * (y + ny * z)] = paletteIndex;
        }
      }
    }
  }
  return voxels;
}

function createModelMatrix(scale: vec3, translate: vec3): mat4 {
  const model = mat4.create();
  mat4.translate(model, model, translate);
  mat4.scale(model, model, scale);
  return model;
}

/** Builds a Cornell box scene using bounding-box objects and 3D‐texture voxel data */
export function createCornellBoxScene(scene: Scene): void {
  // 4‐color palette: red, green, white, gray
  scene.palette = [
    [255, 0, 0, 255], // red
    [0, 255, 0, 255], // green
    [255, 255, 255, 255], // white
    [128, 128, 128, 255], // gray (sphere)
  ];

  scene.objects = [];

  // Left wall: 1×8×8 voxels, red
  scene.objects.push({
    id: 'left_wall',
    dims: [1, 8, 8],
    model: createModelMatrix([1, 8, 8], vec3.fromValues(-4, 0, 0)),
    voxels: createUniformVoxelData([1, 8, 8], 0),
  });

  // Right wall: 1×8×8 voxels, green
  scene.objects.push({
    id: 'right_wall',
    dims: [1, 8, 8],
    model: createModelMatrix([1, 8, 8], vec3.fromValues(4, 0, 0)),
    voxels: createUniformVoxelData([1, 8, 8], 1),
  });

  // Floor: 8×1×8 voxels, white
  scene.objects.push({
    id: 'floor',
    dims: [8, 1, 8],
    model: createModelMatrix([8, 1, 8], vec3.fromValues(0, -4, 0)),
    voxels: createUniformVoxelData([8, 1, 8], 2),
  });

  // Ceiling: 8×1×8 voxels, white
  scene.objects.push({
    id: 'ceiling',
    dims: [8, 1, 8],
    model: createModelMatrix([8, 1, 8], vec3.fromValues(0, 4, 0)),
    voxels: createUniformVoxelData([8, 1, 8], 2),
  });

  // Back wall: 8×8×1 voxels, white
  scene.objects.push({
    id: 'back_wall',
    dims: [8, 8, 1],
    model: createModelMatrix([8, 8, 1], vec3.fromValues(0, 0, -4)),
    voxels: createUniformVoxelData([8, 8, 1], 2),
  });

  // Sphere: 32×32×32 voxels, gray
  scene.objects.push({
    id: 'sphere',
    dims: [32, 32, 32],
    model: createModelMatrix([3, 3, 3], vec3.fromValues(0, 0, 0)),
    voxels: createSphereVoxelData([32, 32, 32], 3),
  });
}

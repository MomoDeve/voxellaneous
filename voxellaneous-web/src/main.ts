import { vec4 } from 'gl-matrix';
import { CameraModule } from './camera';
import { generateTerrainMap } from './map';
import './style.css'

import init, { Renderer } from 'voxellaneous-core';

type AppData = {
  renderer: Renderer;
  canvas: HTMLCanvasElement;
}


function initializeCanvasAutoresize(canvas: HTMLCanvasElement): { autoresizeCanvas: VoidFunction } {
  let newCanvasSize: { width: number; height: number} | undefined; 
  
  const observer = new ResizeObserver((rects) => {
    const rect = rects[0].contentRect;
    newCanvasSize = rect;
  });
  observer.observe(canvas);
  
  const autoresizeCanvas = () => {
    if (!newCanvasSize) return;
    
    data.canvas.width = newCanvasSize.width;
    data.canvas.height = newCanvasSize.height;
    data.renderer.resize(data.canvas.width, data.canvas.height);
    newCanvasSize = undefined
  }
  
  return { autoresizeCanvas }
}

async function initializeApp(): Promise<AppData> {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  
  await init({});
  const renderer = await Renderer.new(canvas);

  const cameraModule = new CameraModule(canvas);
  cameraModule.camera.position = [10, 5, -10];

  const { autoresizeCanvas } = initializeCanvasAutoresize(canvas);
  
  const render = () => {
    autoresizeCanvas();
    
    cameraModule.update();
    const mvpMatrix = cameraModule.calculateMVP();
    
    renderer.render(new Float32Array(mvpMatrix));
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  
  renderer.upload_map(new Float32Array(generateTerrainMap()));

  const colors: vec4[] = [
    [0.13, 0.55, 0.13, 1.0], 
    [0.18, 0.60, 0.44, 1.0], 
    [0.24, 0.70, 0.44, 1.0],  
    [0.18, 0.58, 0.10, 1.0],  
    [0.34, 0.78, 0.34, 1.0], 
    [0.26, 0.63, 0.06, 1.0], 
    [0.19, 0.60, 0.19, 1.0],  
    [0.13, 0.54, 0.13, 1.0],  
  ];
  renderer.upload_materials(new Float32Array(colors.flat() as number[]));
    
  
  return { renderer, canvas }
}

export const data = await initializeApp();

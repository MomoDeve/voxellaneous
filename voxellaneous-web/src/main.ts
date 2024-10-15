import { vec4 } from 'gl-matrix';
import { CameraModule } from './camera';
import { generateTerrainMap } from './terrain/generator';
import './style.css'

import init, { Renderer } from 'voxellaneous-core';
import { initializeTerrainEditor } from './terrain/editor';

type AppData = {
  renderer: Renderer;
  canvas: HTMLCanvasElement;
}

export function updateTerrainMap(app: AppData): void {
  app.renderer.upload_map(new Float32Array(generateTerrainMap()));
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
    
    App.canvas.width = newCanvasSize.width;
    App.canvas.height = newCanvasSize.height;
    App.renderer.resize(App.canvas.width, App.canvas.height);
    newCanvasSize = undefined
  }
  
  return { autoresizeCanvas }
}

async function initializeApp(): Promise<AppData> {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  
  await init({});
  const renderer = await Renderer.new(canvas);
  const app: AppData = { renderer, canvas };

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
  
  updateTerrainMap(app);
  initializeTerrainEditor();

  const colors: vec4[] = [
    [0.13, 0.55, 0.13, 1.0], 
    [0.03, 0.57, 0.03, 1.0],  
    [0.18, 0.58, 0.10, 1.0],  
    [0.18, 0.60, 0.44, 1.0], 
    [0.30, 0.60, 0.30, 1.0],  
    [0.26, 0.63, 0.06, 1.0], 
    [0.24, 0.70, 0.44, 1.0],  
    [0.44, 0.70, 0.24, 1.0], 
  ];
  renderer.upload_materials(new Float32Array(colors.flat() as number[]));
    
  return app;
}

export const App = await initializeApp();

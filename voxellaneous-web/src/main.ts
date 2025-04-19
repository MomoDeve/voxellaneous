import { CameraModule } from './camera';
import './style.css';

import init, { Renderer } from 'voxellaneous-core';
import { initializeDevTools } from './editor';
import { createCornellBoxScene } from '../tests/cornell-box';
import { Scene } from './scene';
import { ProfilerData, updateProfilerData } from './profiler-data';

export type AppData = {
  renderer: Renderer;
  canvas: HTMLCanvasElement;
};

function createCanvasAutoresize({ renderer, canvas }: AppData): { autoresizeCanvas: VoidFunction } {
  let newCanvasSize: { width: number; height: number } | undefined;

  const observer = new ResizeObserver((rects) => {
    const rect = rects[0].contentRect;
    newCanvasSize = rect;
  });
  observer.observe(canvas);

  const autoresizeCanvas = () => {
    if (!newCanvasSize) return;

    canvas.width = newCanvasSize.width;
    canvas.height = newCanvasSize.height;
    renderer.resize(canvas.width, canvas.height);
    newCanvasSize = undefined;
  };

  return { autoresizeCanvas };
}

function registerRecurringAnimation(f: FrameRequestCallback): void {
  const loop: FrameRequestCallback = (t) => {
    f(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

async function initializeApp(): Promise<AppData> {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

  await init({});
  const renderer = await Renderer.new(canvas);
  const app: AppData = { renderer, canvas };
  const profilerData: ProfilerData = { fps: 0, frameTime: 0, lastTimeStamp: 0 };

  const cameraModule = new CameraModule(canvas);
  cameraModule.camera.position = [2, 2, -2];
  cameraModule.camera.speed = 0.1;

  const { autoresizeCanvas } = createCanvasAutoresize(app);

  const render: FrameRequestCallback = (time) => {
    autoresizeCanvas();
    updateProfilerData(profilerData, time);

    cameraModule.update();
    const mvpMatrix = cameraModule.calculateMVP();

    renderer.render(new Float32Array(mvpMatrix), new Float32Array(cameraModule.camera.position));
  };
  registerRecurringAnimation(render);

  initializeDevTools(app, profilerData);

  const scene: Scene = {
    palette: [],
    objects: [],
  };
  createCornellBoxScene(scene);
  renderer.upload_scene(scene);

  return app;
}

export const App = await initializeApp();

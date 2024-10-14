import { CameraModule } from './camera';
import './style.css'

import init, { Renderer } from 'voxellaneous-core';

type AppData = {
  renderer: Renderer;
  canvas: HTMLCanvasElement;
  observer: ResizeObserver;
}

export const data = await initializeApp();

function autofitCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
}

async function initializeApp(): Promise<AppData> {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  autofitCanvas(canvas);

  await init({});
  const renderer = await Renderer.new(canvas);
  const cameraModule = new CameraModule(canvas);

  const render = () => {
    cameraModule.update();
    const mvpMatrix = cameraModule.calculateMVP();
    renderer.render(new Float32Array(mvpMatrix));
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  const observer = new ResizeObserver(() => {
    autofitCanvas(canvas);
    renderer.resize(canvas.width, canvas.height);
  });
  observer.observe(canvas);

  return { renderer, canvas, observer }
}


import './style.css'

import init, { start } from 'voxellaneous-core';



run();

function autofitCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
}

async function run() {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  autofitCanvas(canvas);

  await init({});
  await start(canvas);
}


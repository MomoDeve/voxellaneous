import { Pane } from 'tweakpane';
import { AppData } from '../main';
import { ProfilerData } from '../profiler-data';

type GPUData = {
  name: string;
  vendor: number;
  device: number;
  device_type: string;
  driver: string;
  driver_info: string;
  backend: string;
};

export function initializeRendererTools(pane: Pane, app: AppData, profilerData: ProfilerData): void {
  const gpuData = app.renderer.get_gpu_info() as GPUData;

  const rendererFolder = pane.addFolder({ title: 'Renderer' });
  rendererFolder.expanded = false;

  rendererFolder.addBinding(gpuData, 'name', { label: 'Name', readonly: true });
  rendererFolder.addBinding(gpuData, 'vendor', { label: 'Vendor', readonly: true, format: (v) => Math.floor(v) });
  rendererFolder.addBinding(gpuData, 'device', { label: 'Device', readonly: true, format: (v) => Math.floor(v) });
  rendererFolder.addBinding(gpuData, 'device_type', { label: 'Device Type', readonly: true });
  rendererFolder.addBinding(gpuData, 'driver', { label: 'Driver', readonly: true });
  rendererFolder.addBinding(gpuData, 'driver_info', { label: 'Driver Info', readonly: true });
  rendererFolder.addBinding(gpuData, 'backend', { label: 'Backend', readonly: true });

  const performanceFolder = pane.addFolder({ title: 'Performance' });
  performanceFolder.addBinding(profilerData, 'fps', { label: 'FPS', readonly: true, format: (v) => v.toFixed(2) });
  performanceFolder.addBinding(profilerData, 'frameTime', {
    label: 'Frame Time (ms)',
    readonly: true,
    format: (v) => v.toFixed(2),
  });
}

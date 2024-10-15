import { FolderApi, Pane } from 'tweakpane';
import { NoiseParams } from './generator';
import { App, updateTerrainMap } from '../main';
import { Bindable } from '@tweakpane/core';

function addBinding(folder: FolderApi, label: string, object: Bindable, key: keyof Bindable): void {
    folder.addBinding(object, key, {
        view: 'slider',
        min: 0.0,
        step: 0.001,
        format: (v) => v.toFixed(3),
        label,
    });
}

export function initializeTerrainEditor() {
const pane = new Pane();

// Folder for noise scales
const scaleFolder = pane.addFolder({ title: 'Noise Scales' });
NoiseParams.scales.forEach((_, idx) => {
    addBinding(scaleFolder, `Scale ${idx + 1}`, NoiseParams.scales, idx.toString());
});


// Folder for noise amplitudes
const amplitudeFolder = pane.addFolder({ title: 'Noise Amplitudes' });
NoiseParams.amplitudes.forEach((_, idx) => {
    addBinding(amplitudeFolder, `Amplitude ${idx + 1}`, NoiseParams.amplitudes, idx.toString());
});

// Add listeners to regenerate terrain when parameters change
pane.on('change', () => updateTerrainMap(App));
}
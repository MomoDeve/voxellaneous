import { FolderApi, Pane } from 'tweakpane';
import { NoiseParams } from './generator';
import { AppData, updateTerrainMap } from '../main';
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

export function initializeTerrainEditor(pane: Pane, app: AppData) {
    const scaleFolder = pane.addFolder({ title: 'Noise Scales' });
    NoiseParams.scales.forEach((_, idx) => {
        addBinding(scaleFolder, `Scale ${idx + 1}`, NoiseParams.scales, idx.toString());
    });

    const amplitudeFolder = pane.addFolder({ title: 'Noise Amplitudes' });
    NoiseParams.amplitudes.forEach((_, idx) => {
        addBinding(amplitudeFolder, `Amplitude ${idx + 1}`, NoiseParams.amplitudes, idx.toString());
    });

    pane.addButton({
        title: 'Regenerate Terrain',
    }).on('click', () => updateTerrainMap(app, Math.random()));

    // Add listeners to regenerate terrain when parameters change
    scaleFolder.on('change', () => updateTerrainMap(app));
    amplitudeFolder.on('change', () => updateTerrainMap(app));
}
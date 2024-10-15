import { Pane } from "tweakpane";
import { AppData } from "./main";
import { initializeTerrainEditor } from "./terrain/editor";
import { initializeRendererEditor } from "./renderer/editor";

export function initializeEditor(app: AppData): void {
    const pane = new Pane();
    initializeRendererEditor(pane, app);
    initializeTerrainEditor(pane, app);
}
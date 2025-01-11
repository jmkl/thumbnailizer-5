import { Layers } from "photoshop/dom/collections/Layers";
import { Layer } from "photoshop/dom/Layer";

export function findLayer(layers: Layers, layerName: string): Layer {
  for (const layer of layers) {
    if (layer.kind === "group") {
      const res = findLayer(layer.layers, layerName);
      if (res) return res;
    } else {
      if (layer.name === layerName) {
        return layer;
      }
    }
  }
}

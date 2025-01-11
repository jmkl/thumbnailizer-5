import { Layers } from "photoshop/dom/collections/Layers";
import { Layer } from "photoshop/dom/Layer";

export function findGroup(layers: Layers, groupName: string): Layer {
  for (const layer of layers) {
    if (layer.kind === "group" && layer.name !== groupName) {
      const res = findGroup(layer.layers, groupName);
      if (res) return res;
    } else {
      if (layer.name === groupName) {
        return layer;
      }
    }
  }
}

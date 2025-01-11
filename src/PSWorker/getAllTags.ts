import { app } from "photoshop";
import { Layers } from "photoshop/dom/collections/Layers";
import { Layer } from "photoshop/dom/Layer";

export function getAllTags() {
  let datas: Layer[] = [];
  function recurse(data: Layers, istag: boolean) {
    data.forEach((d) => {
      if (d?.kind == "group") {
        if (d?.name == "TAG") {
          recurse(d?.layers, true);
        } else {
          recurse(d?.layers, false);
        }
      } else {
        if (istag) {
          datas?.push(d);
        }
      }
    });
  }
  recurse(app.activeDocument?.layers, false);
  return datas;
}

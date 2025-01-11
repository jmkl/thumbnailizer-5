import { storage } from "uxp";
import { appendLinkedObject } from "./appendLinkedObject";
import { RectSelection, SelectionBound } from "./Model";
import { app, constants, core } from "photoshop";

export async function appendLinkedObjectWithSelection(
  template: storage.File,
  selection_bounds: SelectionBound
) {
  try {
    let resize_me = selection_bounds.right - selection_bounds.left > 0;
    await appendLinkedObject(template, template.name);

    let sourceheight = 720;
    if (resize_me) {
      sourceheight = selection_bounds.bottom - selection_bounds.top;
    }
    const newlayer = app.activeDocument.activeLayers[0];
    const layer = newlayer.boundsNoEffects;
    const curheight = layer.height;
    let percentage = (sourceheight / curheight) * 100;
    console.log(selection_bounds);

    core
      .executeAsModal(
        async (ctx, desc) => {
          await app.activeDocument.activeLayers[0]
            .scale(
              percentage,
              percentage,
              constants.AnchorPosition.MIDDLECENTER
            )
            .catch((e) => console.error(e));
        },
        { commandName: "Resize" }
      )
      .catch((e) => console.log(e));
  } catch (error) {
    console.error(error);
  }
}

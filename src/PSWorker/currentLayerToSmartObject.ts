import { action, app } from "photoshop";

export async function currentLayerToSmartObject() {
  const layer = app.activeDocument.activeLayers[0];
  if (layer.kind !== "smartObject") {
    await action
      .batchPlay(
        [
          {
            _obj: "newPlacedLayer",
          },
        ],
        {}
      )
      .catch((e) => {});
  }
}

import { core, action, app, constants } from "photoshop";
import { storage } from "uxp";
const fs = storage.localFileSystem;

export async function appendLinkedObject(
  template: storage.File,
  filename: string,
  extract: boolean = false
) {
  return new Promise(async (resolve, reject) => {
    await core
      .executeAsModal(
        async () => {
          await action
            .batchPlay(
              [
                {
                  _obj: "placeEvent",
                  null: {
                    _path: await fs.createSessionToken(template),
                    _kind: "local",
                  },
                  linked: true,
                },
              ],
              {}
            )
            .catch((e) => {
              console.log(e);
              reject(e);
            });

          if (extract) {
            await action.batchPlay(
              [
                {
                  _obj: "placedLayerConvertToLayers",
                },
              ],
              {}
            );
          }
          setTimeout(async () => {
            if (filename.includes("0001")) {
              await rasterizeLinkedObject();
              resolve("Done");
            } else {
              resolve("Done");
            }
          }, 100);
        },
        { commandName: "insert smart object" }
      )
      .catch((e) => {
        console.log(e);
        reject(e);
      });
  });
}

async function rasterizeLinkedObject() {
  await core.executeAsModal(
    async () => {
      await action
        .batchPlay(
          [
            {
              _obj: "rasterizeLayer",
              _target: [
                {
                  _ref: "layer",
                  _enum: "ordinal",
                  _value: "targetEnum",
                },
              ],
            },
            {
              _obj: "newPlacedLayer",
            },
          ],
          {}
        )
        .catch((e) => {
          console.log(e);
        });
      const _paste_layer = app.activeDocument.activeLayers[0];
      _paste_layer.move(
        app.activeDocument.layers[0],
        constants.ElementPlacement.PLACEBEFORE
      );
    },
    { commandName: "rasterize" }
  );
}

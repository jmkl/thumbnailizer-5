import { action, app, core } from "photoshop";
import { storage } from "uxp";
import { executeSuspendHistory } from "./executeSuspendHistory";
import { undo } from "./undo";
import { soloLayer } from "./soloLayer";

export async function selectionToImagePicker(
  folder: storage.Folder,
  mode: "CROP" | "LAYER"
): Promise<string> {
  switch (mode) {
    case "CROP":
      return await PickCrop(folder);

    case "LAYER":
      return PickLayer(folder);
      break;
  }
}

function rename(name: string) {
  const match = name.match(/^[^_]+/); // Match everything before the first underscore
  return match ? match[0] : name;
}

function PickLayer(folder: storage.Folder): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await executeSuspendHistory("save selected layer to image", async () => {
      let selectedLayer = app.activeDocument.activeLayers[0];
      let rand_name = genRand(null, true);
      rand_name = rename(selectedLayer.name) + "_" + rand_name;
      selectedLayer.name = rand_name;
      await soloLayer(selectedLayer.id);
      await action.batchPlay(
        [
          {
            _obj: "exportSelectionAsFileTypePressed",
            _target: {
              _ref: "layer",
              _id: selectedLayer.id,
            },
            fileType: "png",
            quality: 32,
            metadata: 0,
            destFolder: folder.nativePath,
            sRGB: true,
            openWindow: false,
            _options: { dialogOptions: "dontDisplay" },
          },
        ],
        {}
      );
      setTimeout(async () => {
        await soloLayer(selectedLayer.id);
      }, 300);
      resolve(rand_name + ".png");
    });
  });
}

function PickCrop(folder: storage.Folder): Promise<string> {
  console.log(folder);
  const node_name = "cropped_";

  return new Promise(async (resolve, _) => {
    await executeSuspendHistory("save selection", async () => {
      await action
        .batchPlay(
          [
            {
              _obj: "flattenImage",
            },
          ],
          {}
        )
        .catch((e) => console.log(e));

      await action
        .batchPlay(
          [
            {
              _obj: "copyEvent",
              copyHint: "pixels",
            },
          ],
          {}
        )
        .catch((e) => console.log(e));
    });

    await core.executeAsModal(
      async (ctx, desc) => {
        await undo();
        await action
          .batchPlay(
            [
              {
                _obj: "paste",
                inPlace: true,
                antiAlias: {
                  _enum: "antiAliasType",
                  _value: "antiAliasNone",
                },
                as: {
                  _class: "pixel",
                },
                _isCommand: true,
              },
            ],
            {}
          )
          .catch((e) => console.log(e));
        await action.batchPlay(
          [
            {
              _obj: "set",
              _target: [
                {
                  _ref: "channel",
                  _property: "selection",
                },
              ],
              to: {
                _ref: "channel",
                _enum: "channel",
                _value: "transparencyEnum",
              },
              _isCommand: true,
            },
          ],
          {}
        );

        let selectedLayer = app.activeDocument.activeLayers[0];

        let random_name = genRand(null, true);
        if (node_name) random_name = node_name + "_" + random_name;

        selectedLayer.name = random_name;
        const result = await action
          .batchPlay(
            [
              {
                _obj: "exportSelectionAsFileTypePressed",
                _target: {
                  _ref: "layer",
                  _enum: "ordinal",
                  _value: "targetEnum",
                },
                fileType: "png",
                quality: 32,
                metadata: 0,
                destFolder: folder.nativePath, //destFolder.nativePath,
                sRGB: true,
                openWindow: false,
                _options: { dialogOptions: "dontDisplay" },
              },
            ],
            {}
          )
          .catch((e) => console.log(e));
        const resultname = random_name + ".png";

        resolve(resultname);
      },
      { commandName: "pickrop" }
    );
  });
}

export function genRand(filetype: string, without_extension: boolean) {
  if (filetype)
    return (
      (Math.random() + 1).toString(36).substring(7) +
      filetype.replace("image/", ".")
    );
  else
    return (
      (Math.random() + 1).toString(36).substring(7) +
      (without_extension ? "" : ".png")
    );
}

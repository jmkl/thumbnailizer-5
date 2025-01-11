import { app, core } from "photoshop";
import { ActionDescriptor } from "photoshop/dom/CoreModules";
import { storage } from "uxp";
const fs = storage.localFileSystem;

export async function currentLayerToSmartObject(
  so_token: storage.Folder,
  file_name: string
): Promise<string> {
  const layer = app.activeDocument.activeLayers[0];

  if (!layer) return;
  const all_smartobject = await so_token.getEntries();
  const outfile_path = await core
    .executeAsModal(
      async () => {
        const new_name = await findSmartObjectName(all_smartobject, file_name);

        layer.name = new_name;

        try {
          const new_so = await so_token.createFile(new_name, {
            overwrite: false,
          });
          const new_session = fs.createSessionToken(new_so);
          const result = await app.batchPlay(
            [
              {
                _obj: "newPlacedLayer",
              },
              {
                _obj: "placedLayerConvertToLinked",
                _target: [
                  {
                    _ref: "layer",
                    _enum: "ordinal",
                    _value: "targetEnum",
                  },
                ],
                using: {
                  _path: new_session,
                  _kind: "local",
                },
              },
            ],
            {}
          );
          console.log(result);
          const filepath = findNestedObject(result, "_path");
          console.log(filepath);
          return filepath?._path;
        } catch (error) {
          console.error(error);
        }
      },
      { commandName: "layer name" }
    )
    .catch((e) => console.error(e));
  console.log(outfile_path);
  return outfile_path;
}
function findSmartObjectName(
  all_smartobject: storage.Entry[],
  file_name: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const numb_name = all_smartobject
      ?.map((so) => so.name)
      ?.map((psbfile) => {
        const filename = psbfile.replace(".psb", "").split("_");
        return parseInt(filename[filename.length - 1]);
      })
      .filter((n) => !isNaN(n));

    const num = Math.max(...numb_name);
    resolve(
      num == -Infinity ? `${file_name}_0.psb` : `${file_name}_${num + 1}.psb`
    );
  });
}

function findNestedObject(
  entireObj: ActionDescriptor[],
  keyToFind: string
): any {
  let foundObj;
  JSON.stringify(entireObj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
}

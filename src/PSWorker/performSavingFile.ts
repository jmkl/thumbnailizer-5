import { action, app, core } from "photoshop";
import { multiGet } from "./multiGet";
import { storage } from "uxp";
import { ServerSocket } from "../ServerSocket";
const fs = storage.localFileSystem;

type GetToken = {
  name: string;
  layerID: number;
};

function getMaxNumber(ntries: storage.Entry[]) {
  const files = ntries.filter((e) => e.name.indexOf("psd") > 0);
  const names: number[] = [];
  files.forEach((child) => {
    const name = parseInt(child.name.replace(".psd", ""));
    if (!isNaN(name)) names.push(name);
  });
  return Math.max(...names);
}
export async function performSavingFile(
  rootFolder: storage.Folder,
  socket: ServerSocket
) {
  const all = await multiGet();
  const CHANNEL_TOKEN = "rhc-";
  const layers: string[] = all[0].list.map((l: GetToken) => l.name);
  const channels = layers.filter((e) =>
    e.toLowerCase().includes(CHANNEL_TOKEN)
  );
  if (channels.length == 0) {
    return;
  }
  let CHANNEL = { channel: "rhc", folder: "refly" };
  let message: string | null = null;
  const token = (await rootFolder.getEntry(CHANNEL.folder)) as storage.Folder;

  const doc = app.activeDocument;
  if (doc.title.includes("Untitled")) {
    let num = 0;
    const files = await token.getEntries();
    let max_num = getMaxNumber(files);
    if (max_num == -Infinity) max_num = 0;
    num = max_num + 1;
    message = await saveDoc(token, num.toString());
  } else if (doc.title.includes(".psd")) {
    message = await saveDoc(token, doc.title.replace(".psd", ""));
  }

  if (message) {
    socket.sendMessage({
      type: "filepath",
      fromserver: false,
      channel: CHANNEL.channel,
      data: message,
    });
  }
}

function saveDoc(token: storage.Folder, namafile: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const newJPG = await token.createFile(namafile + ".jpeg", {
      overwrite: true,
    });
    const newPSD = await token.createFile(namafile + ".psd", {
      overwrite: true,
    });
    const saveJPEG = await fs.createSessionToken(newJPG);
    const savePSD = await fs.createSessionToken(newPSD);
    await core.executeAsModal(
      async () => {
        const result = await action.batchPlay(
          [
            {
              _obj: "save",
              as: {
                _obj: "photoshop35Format",
                maximizeCompatibility: true,
              },
              in: {
                _path: savePSD,
                _kind: "local",
              },
              documentID: app.activeDocument.id,
              lowerCase: true,
              saveStage: {
                _enum: "saveStageType",
                _value: "saveBegin",
              },
            },
            {
              _obj: "save",
              as: {
                _obj: "JPEG",
                extendedQuality: 10,
                matteColor: {
                  _enum: "matteColor",
                  _value: "none",
                },
              },
              in: {
                _path: saveJPEG,
                _kind: "local",
              },
              documentID: app.activeDocument.id,
              copy: true,
              lowerCase: true,
              saveStage: {
                _enum: "saveStageType",
                _value: "saveBegin",
              },
            },
          ],
          {}
        );

        resolve(result[1].in._path);
      },
      { commandName: "saving files" }
    );
  });
}

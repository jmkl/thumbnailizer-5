import { storage } from "uxp";
import fs from "fs";
import { appendLinkedObject } from "./appendLinkedObject";
import { generateRandomName } from "./generateRandomName";

export function placeBufferToLayer(
  base64: string,
  leonardo_path: storage.Folder
) {
  const base64String = base64.split(",")[1];
  const binaryString = atob(base64String);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  appendLinkedImageToLayer(leonardo_path, buffer);
}

async function appendLinkedImageToLayer(
  folder: storage.Folder,
  buffer: Uint8Array<ArrayBuffer>
) {
  try {
    const filename = `${generateRandomName(5)}.png`;
    const p = `${folder.nativePath}\\${filename}`;

    fs.writeFileSync(p, buffer);

    folder.getEntry(filename).then(async (e) => {
      await appendLinkedObject(e as storage.File, filename);
    });
  } catch (error) {
    console.log(error);
  }
}

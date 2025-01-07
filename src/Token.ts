import { FOLDERNAME, TOKEN } from "./Model";
import { storage } from "uxp";
const fs = storage.localFileSystem;
// const fs = require("uxp").storage.localFileSystem;

export class Token {
  rootFolder: storage.Entry;
  constructor() {}
  async getRootFolder() {
    const result = await this.getTokenFor(TOKEN.ROOTFOLDER);
    this.rootFolder = result;
    if (!result) {
      const folder = await this.pickFolderFor(TOKEN.ROOTFOLDER);
      if (folder) {
        const result = await this.getTokenFor(TOKEN.ROOTFOLDER);
        this.rootFolder = result;
      }
    }
    return this.rootFolder;
  }
  pickFolderFor(key: string) {
    return new Promise(async (resolve, reject) => {
      const fo_result = await fs.getFolder({
        initialDomain: null,
      });

      if (fo_result) {
        const _token = await fs.createPersistentToken(fo_result);
        localStorage.setItem(key, _token);
        resolve(fo_result);
      } else {
        resolve(null);
      }
    });
  }
  getTokenFor(key: string): Promise<storage.Entry> {
    const savedToken = localStorage.getItem(key);
    if (!savedToken) {
      return null;
    }
    return new Promise(async (resolve, reject) => {
      const newToken = await fs.getEntryForPersistentToken(savedToken);
      newToken.isFolder ? resolve(newToken) : resolve(null);
    });
  }
}

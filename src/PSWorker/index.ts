import { action, core } from "photoshop";
import { createNewDocument } from "./createNewDocument";
import { AdjustmentLayer, AlignLayer, HotkeyToken, TagVert } from "./Model";
import { performAlignLayer } from "./performAlignLayer";
import { performAdjustmentLayer } from "./performAdjustmentLayer";
import { performAlignSelectedLayers } from "./performAlignSelectedLayers";
import { storage } from "uxp";
import { placeBufferToLayer } from "./placeBufferToLayer";
import { FolderName } from "../Model";
import ExecScript from "./ScriptExecutor";
import { ServerSocket } from "../ServerSocket";
import Logger from "../Logger";
import { appendLinkedObject } from "./appendLinkedObject";
import { currentLayerToSmartObject } from "./currentLayerToSmartObject";

export type SocketServerData = {
  fromserver: boolean;
  type: string;
  data: string;
};
export class PSWorker {
  withTag: false;
  rootFolder: storage.Folder;
  customScripts: string[];
  customScriptFolder: storage.Folder;
  smartObjectFolder: storage.Folder;
  scriptExecutor;
  logger: Logger;
  serverSocket: ServerSocket;
  constructor(server: ServerSocket, logger: Logger) {
    this.logger = logger;
    this.scriptExecutor = new ExecScript(logger);
    this.serverSocket = server;
  }

  async setRootFolder(folder: storage.Folder) {
    this.rootFolder = folder;
    this.customScriptFolder = (await folder.getEntry(
      FolderName.customscripts
    )) as storage.Folder;
    this.smartObjectFolder = (await folder.getEntry(
      FolderName.smartobject
    )) as storage.Folder;

    this.customScripts = (await this.customScriptFolder.getEntries())
      .reduce((acc, ext) => {
        if (ext.name.endsWith(".js")) acc.push(ext);
        return acc;
      }, [])
      .map((cs) => cs.name);

    this.scriptExecutor.initHelper(this.customScriptFolder);
  }
  async do(content: SocketServerData) {
    switch (content.type) {
      case "leonardo":
        const leonardo_path = await this.rootFolder.getEntry(
          FolderName.leonardo
        );
        placeBufferToLayer(content.data, leonardo_path as storage.Folder);

        break;
      case "customscript":
        const result = this.customScripts.filter((cs) => {
          return content.data.includes(cs);
        });

        if (result.length > 0) {
          this.scriptExecutor
            .executeCustomScripts(result[0], this.customScriptFolder)
            .then((result) => {
              if (this.serverSocket) {
                this.serverSocket.sendMessage({
                  fromserver: false,
                  type: "execute_customscript",
                  data: "notif",
                });
              }
            });
        }

        break;
      case "fromcomfy":
        break;
      case "todo_clipboard":
        break;
      case "generate_flag":
      case "create_emblem":
      case "create_tag":
        this.rootFolder
          .getEntry(FolderName.gigapixel)
          .then((ggp: storage.Folder) => {
            setTimeout(async () => {
              const namafile = content?.data?.split(/[\/\\]+/).pop();
              const _fileentry = (await ggp
                .getEntry(namafile)
                .catch((e) => console.error(e))) as storage.File;
              await appendLinkedObject(_fileentry, namafile);
            }, 500);
          });
        break;
      case "create_smartobject":
        const name = content.data;
        const new_name = await currentLayerToSmartObject(
          this.smartObjectFolder,
          name
        );
        if (this.serverSocket) {
          this.serverSocket.sendMessage({
            type: "create_thumb",
            fromserver: false,
            data: new_name,
          });
        }
        break;
      case "process_rawfilter":
        break;
      case "apply_tag_layer":
        break;
      case "apply_color":
        break;
      case "append_image":
        break;
      case "url":
        break;
      case "hotkey":
        this.doHotkeys(content.data);
        break;
      case "from-aiotools-applytemplate":
        break;
      case "append_comfyui_output":
        break;
      case "selection_to_image":
        break;

      default:
        break;
    }
  }

  async processHotkey(tv: TagVert, align: HotkeyToken) {
    performAlignLayer(tv, align);
  }
  async alignLayers(align: AlignLayer, toCanvas: boolean) {
    performAlignSelectedLayers(align, toCanvas);
  }
  async applyAdjustmentLayer<T>(adjustment: T) {
    performAdjustmentLayer(adjustment);
  }

  async doHotkeys(params: string) {
    const tagvert = { tag: this.withTag, vertical_align: false };

    switch (params) {
      case "rawfilter":
        break;
      case "save":
        //await handleSavingFile();
        break;
      case "newdoc":
        await createNewDocument();
        break;
      case "topleft":
        await this.processHotkey(tagvert, HotkeyToken.tl);
        break;
      case "toptop":
        await this.processHotkey(tagvert, HotkeyToken.tt);
        break;
      case "topright":
        await this.processHotkey(tagvert, HotkeyToken.tr);
        break;
      case "midleft":
        await this.processHotkey(tagvert, HotkeyToken.ml);
        break;
      case "midmid":
        await this.processHotkey(tagvert, HotkeyToken.mm);
        break;
      case "midright":
        await this.processHotkey(tagvert, HotkeyToken.mr);
        break;
      case "botleft":
        await this.processHotkey(tagvert, HotkeyToken.bl);
        break;
      case "botbot":
        await this.processHotkey(tagvert, HotkeyToken.bm);
        break;
      case "botright":
        await this.processHotkey(tagvert, HotkeyToken.br);
        break;
      case "LEFT":
        await this.alignLayers(AlignLayer.LEFT, false);
        break;
      case "MID":
        await this.alignLayers(AlignLayer.CENTERHORIZONTAL, false);
        break;
      case "RIGHT":
        await this.alignLayers(AlignLayer.RIGHT, false);
        break;
      case "adj_curves":
        await this.applyAdjustmentLayer(AdjustmentLayer.CURVES);
        break;
      case "adj_huesaturation":
        await this.applyAdjustmentLayer(AdjustmentLayer.HUESATURATION);
        break;
      case "adj_exposure":
        await this.applyAdjustmentLayer(AdjustmentLayer.EXPOSURE);
        break;
      case "adj_colorbalance":
        await this.applyAdjustmentLayer(AdjustmentLayer.COLORBALANCE);
        break;
      case "adj_gradientmap":
        await this.applyAdjustmentLayer(AdjustmentLayer.GRADIENTMAP);
        break;
      case "adj_lut":
        await this.applyAdjustmentLayer(AdjustmentLayer.LUT);
        break;
      case "scalelayer":
        await this.processHotkey(tagvert, HotkeyToken.Scale);
        break;
      case "deleteandfill":
        await require("photoshop").core.performMenuCommand({ commandID: 5280 });
        break;
      case "SCALE":
        await this.processHotkey(tagvert, HotkeyToken.Scale);
        break;
      case "TAGSCALE":
        await this.processHotkey(tagvert, HotkeyToken.TagScale);
        break;
      case "SCALEUP":
        await this.processHotkey(tagvert, HotkeyToken.ScaleUp);
        break;
      case "SWITCHMARGIN":
        //await switchMargin();
        break;
      case "SCALEDOWN":
        await this.processHotkey(tagvert, HotkeyToken.ScaleDown);
        break;

      case "deleteandfill":
        await core.executeAsModal(
          async () => {
            await action.batchPlay(
              [
                {
                  _obj: "invokeCommand",
                  commandID: 5280,
                },
              ],
              {}
            );
          },
          { commandName: "delete n fill" }
        );
    }
  }
}

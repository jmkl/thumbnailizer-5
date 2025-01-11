import { action, core } from "photoshop";
import { createNewDocument } from "./createNewDocument";
import {
  AdjustmentLayer,
  AlignLayer,
  HotkeyToken,
  LinkedObject,
  SelectionBound,
  SocketServerData,
  TagVert,
} from "./Model";
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
import { currentLayerToSmartObject } from "./currentLayerToLinkedSmartObject";
import { performSavingFile } from "./performSavingFile";
import { performApplyTemplate } from "./performApplyTemplate";
import { executeSuspendHistory } from "./executeSuspendHistory";
import { performCreateEmblemAndTag } from "./performCreateEmblemAndTag";
import { performRawFilterEffects, RawFilter } from "./performRawFilterEffects";
import { appendLinkedObjectWithSelection } from "./appendLinkedObjectWithSelection";
import { selectionToImagePicker } from "./selectionToImagePicker";
import { multiGet } from "./multiGet";
import { getAllTags } from "./getAllTags";
import { performApplyColor, removeGuides } from "./performApplyColor";
import { showLoading } from "./showLoading";

export class PSWorker {
  withTag: boolean = false;
  rootFolder: storage.Folder;
  customScripts: string[];
  customScriptFolder: storage.Folder;
  templatesFolder: storage.Folder;
  smartObjectFolder: storage.Folder;
  gigaPixelFolder: storage.Folder;
  textureFolder: storage.Folder;
  comfyuiInputFolder: storage.Folder;
  comfyuiOutputFolder: storage.Folder;
  scriptExecutor;
  logger: Logger;
  guideTimer: NodeJS.Timeout;
  selectionBounds: SelectionBound = { top: 0, left: 0, bottom: 0, right: 0 };

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

    this.templatesFolder = (await folder.getEntry(
      FolderName.template
    )) as storage.Folder;

    this.smartObjectFolder = (await folder.getEntry(
      FolderName.smartobject
    )) as storage.Folder;

    this.textureFolder = (await folder.getEntry(
      FolderName.texture
    )) as storage.Folder;

    this.gigaPixelFolder = (await folder.getEntry(
      FolderName.gigapixel
    )) as storage.Folder;

    const comfyui = (await folder.getEntry(
      FolderName.comfyui2024
    )) as storage.Folder;
    const comfyui_input = await comfyui.getEntry("input");
    const comfyui_output = await comfyui.getEntry("output");
    try {
      this.comfyuiInputFolder = comfyui_input as storage.Folder;
      this.comfyuiOutputFolder = comfyui_output as storage.Folder;
    } catch (error) {
      console.error(error);
    }

    this.customScripts = (await this.customScriptFolder.getEntries())
      .reduce((acc, ext) => {
        if (ext.name.endsWith(".js")) acc.push(ext);
        return acc;
      }, [])
      .map((cs) => cs.name);

    this.scriptExecutor.initHelper(this.customScriptFolder);
  }

  async setBounds(bounds: SelectionBound) {
    this.selectionBounds = bounds;
  }

  async removeGuide() {
    if (this.guideTimer) clearTimeout(this.guideTimer);
    this.guideTimer = setTimeout(async () => {
      await removeGuides();
    }, 2000);
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

      case "generate_flag":
      case "create_emblem":
      case "create_tag":
        showLoading(true);
        const namafile = content?.data?.split(/[\/\\]+/).pop();
        const _fileentry = (await this.gigaPixelFolder
          .getEntry(namafile)
          .catch((e) => console.error(e))) as storage.File;
        await appendLinkedObject(_fileentry, namafile);
        showLoading(false);
        break;
      case "create_smartobject":
        showLoading(true);
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
        showLoading(false);
        break;
      case "process_rawfilter":
        showLoading(true);
        const rawdata = JSON.parse(content.data);
        console.log(rawdata);
        const rs = await performRawFilterEffects(
          RawFilter(
            rawdata.reduce((a: any, b: any) => {
              a[b.name] = b.value;
              return a;
            }, {})
          ),
          "Adobe Camera Raw Filter"
        );
        this.serverSocket.sendMessage({
          fromserver: false,
          type: "rawfilter_done",
          data: rs,
        });
        showLoading(false);
        break;
      case "apply_tag_layer":
        const tagName = content.data;
        let tag_layers: any;
        multiGet().then((r) => {
          const all_layers = r[0].list;
          const which = all_layers.find((l: any) => l.name == "TAG");
          if (which) {
            tag_layers = [{ name: "None", object: null }].concat(
              getAllTags().map((e) => {
                return { name: e.name, object: e };
              })
            );
          } else {
            tag_layers = [{ name: "None", object: null }];
          }
        });
        if (tag_layers) {
          core.executeAsModal(
            async (c, d) => {
              for (const layer of tag_layers) {
                if (layer) layer.visible = layer.name == tagName ? true : false;
              }
            },
            { commandName: "show Tag" }
          );
        }

        break;
      case "apply_color":
        const cd = JSON.parse(content.data);
        await performApplyColor(cd);
        this.removeGuide();

        break;
      case "append_image":
        showLoading(true);
        const response: LinkedObject = JSON.parse(content.data);

        switch (response.type) {
          case "smartobject":
            this.smartObjectFolder
              .getEntry(response.name + ".psb")
              .then((result: storage.File) => {
                showLoading(false);
                appendLinkedObject(result, response.name);
              });
            break;

          case "texture":
            this.textureFolder
              .getEntry(`${response.category}/${response.name}`)
              .then((result: storage.File) => {
                showLoading(false);
                appendLinkedObject(result, response.name);
                console.log(result);
              });
            break;
        }
        break;
      case "url":
        const filename = content?.data?.split("\\").pop();
        if (filename) {
          showLoading(true);
          this.gigaPixelFolder
            .getEntry(filename)
            .then((result: storage.File) => {
              showLoading(false);
              appendLinkedObject(result, filename);
            })
            .catch((e) => console.error(e));
        }

        break;
      case "hotkey":
        this.doHotkeys(content.data);
        break;
      case "from-aiotools-applytemplate":
        showLoading(true);
        const tmplt = JSON.parse(content.data);
        await executeSuspendHistory("apply template", async () => {
          await performApplyTemplate(this.templatesFolder, tmplt);
        });

        await performCreateEmblemAndTag(tmplt.lines, this.serverSocket);
        showLoading(false);
        break;
      case "append_comfyui_output":
        showLoading(true);
        const comfyui_name = content.data;
        this.comfyuiOutputFolder
          .getEntry(comfyui_name)
          .then((result: storage.File) => {
            appendLinkedObjectWithSelection(result, this.selectionBounds);
          });

        showLoading(false);

        break;
      case "selection_to_image":
        switch (content.data) {
          case "crop":
            showLoading(true);
            selectionToImagePicker(this.comfyuiInputFolder, "CROP").then(
              (result) => {
                this.serverSocket.sendMessage({
                  fromserver: false,
                  type: "crop_selection",
                  data: result,
                  template_index: -1,
                  uuid: content.uuid,
                });
                showLoading(false);
              }
            );
            break;

          case "layer":
            showLoading(true);
            selectionToImagePicker(this.comfyuiInputFolder, "LAYER").then(
              (result) => {
                this.serverSocket.sendMessage({
                  fromserver: false,
                  type: "crop_selection",
                  data: result,
                  template_index: -1,
                  uuid: content.uuid,
                });
                showLoading(false);
              }
            );
            break;
        }
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
      case "save":
        await performSavingFile(this.rootFolder, this.serverSocket);
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
        this.withTag = !this.withTag;
        (
          document.querySelector(".logger") as HTMLDivElement
        ).style.paddingLeft = this.withTag ? "25px" : "0px";

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

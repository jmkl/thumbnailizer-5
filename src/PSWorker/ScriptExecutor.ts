import { core, app, action, constants, imaging } from "photoshop";
import { ExecutionContext } from "photoshop/dom/CoreModules";
import Sval from "sval";
import { storage } from "uxp";
import Logger from "../Logger";

export default class ExecScript {
  interpreter: Sval;
  logger;

  constructor(logger: Logger) {
    this.interpreter = new Sval({
      ecmaVer: 9,
      sandBox: false,
    });
    this.logger = logger;
    this.interpreter.import({
      uxp: require("uxp"),
      os: require("os"),
      fs: require("fs"),
      photoshop: require("photoshop"),
      app: require("photoshop").app,
      core: require("photoshop").core,
      logger: logger,
      batchPlay: require("photoshop").action.batchPlay,
      executeAsModal: require("photoshop").core.executeAsModal,
      executeModal: this.executeModal,
      getLayers: this.getAllLayers,
    });
  }

  async initHelper(folder: storage.Folder) {
    const helper = (await folder.getEntry("HELPER.js")) as storage.File;
    const helperscript = await helper.read({ format: storage.formats.utf8 });
    this.interpreter.run(`
     ${helperscript}
    `);
  }

  async runScript(scriptContent: string) {
    return new Promise(async (resolve, reject) => {
      try {
        this.interpreter.run(`
            "use strict";
            async function userCode(){${scriptContent}};
            exports.returnValue = userCode();
            `);
        const res = await this.interpreter.exports.returnValue;
        resolve({ ok: true, data: res });
      } catch (error) {
        console.log(error);
        if (typeof error == "object") {
          resolve({ ok: false, data: JSON.stringify(error) });
        } else {
          resolve({ ok: false, data: error });
        }
      }
    });
  }

  async executeCustomScripts(value: string, folder: storage.Folder) {
    return new Promise(async (resolve, reject) => {
      if (value) {
        const script = (await folder.getEntry(value)) as storage.File;
        //this.initHelper(folder);

        const read_script = (await script.read({
          format: storage.formats.utf8,
        })) as string;
        const result = await this.runScript(read_script);
        resolve(result);
      }
    });
  }
  async executeModal(
    funcName: (executionContext: ExecutionContext, descriptor?: object) => any,
    tagName: string
  ) {
    this.logger.warn("execute as modal");
    try {
      await core.executeAsModal(funcName, { commandName: tagName });
    } catch (error) {
      this.logger.fatal(error);
    }
  }
  async getAllLayers() {
    const layers = await app.batchPlay(
      [
        {
          _obj: "multiGet",
          _target: {
            _ref: "document",
            _id: app.activeDocument.id,
          },
          extendedReference: [
            ["name", "layerID"],
            {
              _obj: "layer",
              index: 1,
              count: -1,
            },
          ],
        },
      ],
      {}
    );
    return layers[0]["list"];
  }
}

import { AppCore } from "./AppCore";
import { PSEvent } from "./PSEvent";
import { ServerSocket } from "./ServerSocket";
import { Token } from "./Token";
import { PSWorker } from "./PSWorker";
import { entrypoints } from "uxp";
import Logger from "./Logger";
import { SocketServerData } from "./PSWorker/Model";
import { getSelectionBound } from "./PSWorker/getSelectionBound";
import { isLayerRAWFiltered } from "./PSWorker/performRawFilterEffects";
import { showLoading } from "./PSWorker/showLoading";
const core = new AppCore().listen();
const server = new ServerSocket().listen();
const token = new Token();
const logger = new Logger();
const psWorker = new PSWorker(server, logger);

const emoOFF: HTMLImageElement = document.querySelector(".off");
const emoON: HTMLImageElement = document.querySelector(".on");
const statusText: HTMLImageElement = document.querySelector(".status-text");

function changeStatus(statusCode: number) {
  statusText.textContent = statusCode == 0 ? "OFFLINE" : "ONLINE";
  statusText.style.color = statusCode == 0 ? "#f00" : "#0f1";
  if (statusCode == 0) {
    emoOFF.classList.remove("hidden");
    emoON.classList.add("hidden");
  } else {
    emoON.classList.remove("hidden");
    emoOFF.classList.add("hidden");
  }
}

//photoshop event handler
core.on(PSEvent.SETSELECT, (content) => {
  if (content === "select") {
    isLayerRAWFiltered(true).then((result) => {
      server.sendMessage({
        fromserver: false,
        type: "layer_select",
        data: JSON.stringify(result),
      });
    });
  }
  getSelectionBound().then((result) => {
    psWorker.setBounds(result.bound);
    server.sendMessage({
      fromserver: false,
      type: "selection_bounds",
      data: JSON.stringify({
        selection_mode: result.mode,
        selection_bounds: result.bound,
      }),
    });
  });
  //selectionChange(content);
});

//server websocket status
server.on<number>(PSEvent.SOCKET_STATUS, (statusCode) => {
  changeStatus(statusCode);
  logger.log(statusCode == 0 ? "OFFLINE" : "ONLINE");
});

//task sent by macropad-hotkeys
server.on<SocketServerData>(PSEvent.SOCKET_MESSAGE, (content) => {
  if (content.fromserver) {
    psWorker.do(content);
    logger.log(`${content.type}>${content.data}`);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const rootfolder = await token.getRootFolder();
  psWorker.setRootFolder(rootfolder);
  showLoading(false);

  document.querySelector(".btn-clear").addEventListener("click", (e) => {
    logger.clear();
  });
});

entrypoints.setup({
  plugin: {
    async create() {},
  },
  panels: {
    mainpanel: {
      async create() {},
      async show() {},
      menuItems: [
        {
          label: "Reload Plugin",
          enabled: true,
          checked: psWorker.withTag,
          id: "reload",
        },
      ],
      async invokeMenu(menuId) {
        if (menuId === "reload") {
          location.reload();
        }
      },
    },
  },
});

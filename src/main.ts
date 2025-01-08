import { AppCore } from "./AppCore";
import { PSEvent } from "./PSEvent";
import { ServerSocket } from "./ServerSocket";
import { Token } from "./Token";
import { PSWorker, SocketServerData } from "./PSWorker";
import Logger from "./Logger";
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
  statusText.style.color = statusCode == 0 ? "#f00" : "#0f0";
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
  //logger.log(content);
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

  document.querySelector(".btn-clear").addEventListener("click", (e) => {
    logger.clear();
  });
});

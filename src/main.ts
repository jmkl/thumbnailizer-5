import { app } from "photoshop";
import { AppCore } from "./AppCore";
import { PSEvent } from "./PSEvent";
import { ServerSocket } from "./ServerSocket";
import { Token } from "./Token";
import { PSWorker, SocketServerData } from "./PSWorker";
import Logger from "./Logger";
const core = new AppCore();
const server = new ServerSocket();
const token = new Token();
const psWorker = new PSWorker();
const logger = new Logger();

const statusImg: HTMLImageElement = document.querySelector(".status-img");

function changeStatus(statusCode: number) {
  statusImg.src = statusCode == 0 ? "asset/sad.png" : "asset/happy.png";
}

//photoshop event handler
core.on(PSEvent.SETSELECT, (content) => {
  logger.log(content);
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
  }
  logger.log(`${content.type}>${content.data}`);
});

document.addEventListener("DOMContentLoaded", async () => {
  const rootfolder = await token.getRootFolder();

  core.listen();
  server.listen();
  psWorker.setRootFolder(rootfolder);
  psWorker.bind(server, logger);

  document.querySelector(".btn-clear").addEventListener("click", (e) => {
    logger.clear();
  });
});

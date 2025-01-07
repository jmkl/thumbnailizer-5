import { app } from "photoshop";
import { AppCore } from "./AppCore";
import { PSEvent } from "./PSEvent";
import { ServerSocket } from "./ServerSocket";
import { Token } from "./Token";
import { PSWorker, SocketServerData } from "./PSWorker";
const core = new AppCore();
const server = new ServerSocket();
const token = new Token();
const psWorker = new PSWorker();

const logger = document.querySelector(".logger");
const statusImg: HTMLImageElement = document.querySelector(".status-img");

function changeStatus(statusCode: number) {
  statusImg.src = statusCode == 0 ? "asset/sad.png" : "asset/happy.png";
}

async function appendLog<T>(text: T) {
  const log = document.createElement("div");
  log.textContent =
    typeof text == "string" ? text : JSON.stringify(text, null, 2);
  log.classList.add("truncate");
  log.addEventListener("click", (e) => {
    log.classList.remove("truncate");
  });
  logger.appendChild(log);
}
core.on(PSEvent.SETSELECT, (content) => {
  appendLog(content);
});
server.on<number>(PSEvent.SOCKET_STATUS, (statusCode) => {
  changeStatus(statusCode);
  appendLog(statusCode == 0 ? "OFFLINE" : "ONLINE");
});

server.on<SocketServerData>(PSEvent.SOCKET_MESSAGE, (content) => {
  if (content.fromserver) {
    psWorker.do(content);
  }
  appendLog(`${content.fromserver}::${content.type}`);
});

document.addEventListener("DOMContentLoaded", () => {
  core.listen();
  server.listen();
  token.getRootFolder().then((result) => {
    console.log(result);
  });
  document.querySelector(".btn-clear").addEventListener("click", (e) => {
    while (logger.firstChild) {
      logger.firstChild.removeEventListener("click", null);
      logger.removeChild(logger.firstChild);
    }
  });
});

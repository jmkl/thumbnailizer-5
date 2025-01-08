import { PSEventEmitter, PSEvent } from "./PSEvent";
import { SocketServerData } from "./PSWorker";

export class ServerSocket extends PSEventEmitter {
  private socket;
  constructor() {
    super();
    this.socket = new WebSocket("ws://localhost:1337/Server");
    return this;
  }
  listen() {
    this.socket.addEventListener("open", () => {
      this.emit(PSEvent.SOCKET_STATUS, this.socket.readyState);
    });
    this.socket.addEventListener("close", () => {
      this.emit(PSEvent.SOCKET_STATUS, this.socket.readyState);
    });
    this.socket.addEventListener("message", (event) => {
      if (event.data) {
        const data = JSON.parse(event.data);
        this.emit(PSEvent.SOCKET_MESSAGE, data);
      }
    });
    return this;
  }

  sendMessage(message: SocketServerData): boolean {
    if (this.socket) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      return false;
    }
  }
}

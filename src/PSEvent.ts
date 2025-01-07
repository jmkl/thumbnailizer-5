type Listener<T = any> = (payload: T) => void;

export enum PSEvent {
  SETSELECT = "set-select-event",
  SOCKET_STATUS = "socket-status-event",
  SOCKET_MESSAGE = "socket-message-event",
}
export class PSEventEmitter {
  private events: Map<string, Listener[]>;
  constructor() {
    this.events = new Map();
  }

  on<T>(eventName: string, listener: Listener<T>) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(listener);
  }
  off<T>(eventName: string, listener: Listener<T>): void {
    const listeners = this.events.get(eventName);
    if (!listeners) return;
    this.events.set(
      eventName,
      listeners.filter((l) => l !== listener)
    );
  }
  emit<T>(event: string, payload?: T): void {
    const listeners = this.events.get(event);
    if (!listeners) return;
    listeners.forEach((listener) => listener(payload!));
  }
}

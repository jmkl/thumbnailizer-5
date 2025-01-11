import { action } from "photoshop";
import { ActionDescriptor } from "photoshop/dom/CoreModules";
import { PSEvent, PSEventEmitter } from "./PSEvent";

export class AppCore extends PSEventEmitter {
  constructor() {
    super();
    this.actionListener = this.actionListener.bind(this);
  }
  actionListener(eventname: string, descriptor: ActionDescriptor) {
    if (!descriptor._isCommand) {
      if (eventname === "set" || eventname === "select") {
        this.emit(PSEvent.SETSELECT, eventname);
      }
    }
  }

  listen() {
    action.addNotificationListener(["set", "select"], this.actionListener);
    return this;
  }
}

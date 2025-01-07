import { action } from "photoshop";
import { ActionDescriptor } from "photoshop/dom/CoreModules";
import { PSEvent, PSEventEmitter } from "./PSEvent";

export class AppCore extends PSEventEmitter {
  constructor() {
    super();
    this.actionListener = this.actionListener.bind(this);
  }
  actionListener(eventname: string, descriptor: ActionDescriptor) {
    if (["set", "select"].includes(eventname)) {
      this.emit(PSEvent.SETSELECT, JSON.stringify(descriptor, null, 2));
    }
  }

  listen() {
    action.addNotificationListener(
      ["set", "select", "save", "neuralGalleryFilters"],
      this.actionListener
    );
  }
}

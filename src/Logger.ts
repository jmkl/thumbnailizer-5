export default class Logger {
  private logger;
  private enable: boolean;
  constructor() {
    this.enable = true;
    this.logger = document.querySelector(".logger");
    const enableLog = document.querySelector(".enable-log");
    enableLog.addEventListener("change", (ev) => {
      //@ts-ignore
      this.enableLog(ev.currentTarget.checked);
    });
    return this;
  }
  enableLog(enable: boolean) {
    this.enable = enable;
  }
  private write<T>(text: T, color: string) {
    if (!this.enable) return;
    const log = document.createElement("div");
    log.style.color = color;

    log.textContent =
      typeof text == "string" ? text : JSON.stringify(text, null, 2);
    log.classList.add("truncate");

    log.addEventListener("click", (e) => {
      if (log.classList.contains("truncate")) {
        log.classList.remove("truncate");
        log.style.whiteSpace = "pre";
      } else {
        log.classList.add("truncate");
        log.style.whiteSpace = "";
      }
    });
    this.logger.appendChild(log);
  }
  async fatal<T>(text: T) {
    this.write(text, "#f00");
  }
  async warn<T>(text: T) {
    this.write(text, "#ff0");
  }
  async log<T>(text: T) {
    this.write(text, "#ddd");
  }
  clear() {
    while (this.logger.firstChild) {
      this.logger.removeChild(this.logger.firstChild);
    }
  }
}

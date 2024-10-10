import os from "os";

export class PathController {
  constructor() {
    this.currentDir = os.homedir();
    this.EOL = os.EOL;
  }

  setCurrentDir() {}

  getCurrentDir() {
    return this.currentDir;
  }
}

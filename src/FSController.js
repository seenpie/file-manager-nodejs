import os from "os";
import { promises as fs } from "fs";
import path from "path";

export class FSController {
  constructor() {
    this.currentDir = this.getOSHomedir();
    process.chdir(this.currentDir);
    this.historyList = [];
  }

  async up() {
    if (this.currentDir === this.getOSHomedir()) {
      return;
    }
  }

  async cd(dirname) {
    try {
      const newDirectory = path.resolve(this.currentDir, dirname || "");
      await fs.access(newDirectory);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error("no such dir");
      }
    }

    console.log(process.cwd());
  }

  async readDir() {
    try {
      const files = await fs.readdir(this.currentDir, { withFileTypes: true });
      return files
        .map((file) => ({
          name: file.name,
          type: file.isFile() ? "file" : "directory",
        }))
        .sort((a, b) => {
          if (a.type === "directory" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "directory") return 1;
        });
    } catch (error) {}
  }

  //get
  getCurrentDir() {
    return this.currentDir;
  }

  //os
  getOSEol() {
    return os.EOL === "\n" ? "\\n" : "\\r\\n";
  }

  getOSCpus() {
    const cpus = os.cpus();
    const resultString = cpus
      .reduce(
        (acc, current) => {
          const string = `model: ${current.model}\nclock rate: ${(
            current.speed / 1000
          ).toFixed(2)}GHz`;
          acc.push(string);
          return acc;
        },
        [`overall amount of CPUS: ${cpus.length}`]
      )
      .join("\n");

    return resultString;
  }

  getOSHomedir() {
    return os.homedir();
  }

  getOSUsername() {
    return os.userInfo().username;
  }

  getOSArch() {
    return os.arch();
  }

  getOSHelpText() {
    return `OS Commands:\n----------------\nos --EOL         : get End-Of-Line\nos --cpus        : get host machine CPUs info\nos --homedir     : get home directory\nos --username    : get current system user name\nos --architecture: get CPU architecture`;
  }
}

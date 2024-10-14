import { OutputController } from "./OutputController.js";
import { FSController } from "./FSController.js";
import { createInterface } from "readline";
import { textList } from "../models/index.js";
import { CommandController } from "./CommandController.js";

export class AppController {
  constructor() {
    this.username = this._getName();
    this.fsController = new FSController();
    this.outputController = new OutputController();
    this.commandController = new CommandController(this.outputController, this.fsController, this.username);
  }

  async start() {
    this._printGreeting();
    this._openReadline();
  }

  _printGreeting() {
    this.outputController.print(textList.greeting(this.username));
    this.outputController.print(textList.location(this.fsController.getCurrentDir()));
  }

  _openReadline() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("line", async (input) => {
      await this.commandController.handleCommand(input.trim());
    });

    rl.on("close", () => {
      this.outputController.print(textList.goodbye(this.username));
      process.exit(0);
    });
  }

  _parseStartingArgs() {
    const argsList = process.argv.slice(2);
    const argsMap = new Map();

    argsList.forEach((data) => {
      if (data.startsWith("--username")) {
        const [key, value] = data.replace("--", "").split("=");

        if (value !== undefined) {
          argsMap.set(key, value);
        }
      }
    });

    return argsMap;
  }

  _getName() {
    const argsMap = this._parseStartingArgs();
    const name = argsMap.get("username");
    return name ? name : "undefined";
  }
}

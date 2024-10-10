import { parseArgs } from "./lib/parseArgs.js";
import { MessagesController } from "./MessagesController.js";
import { FSController } from "./FSController.js";
import { createInterface } from "readline";

export class AppController {
  constructor() {
    this.username = this._getName();
    this.messagesController = new MessagesController();
    this.fsController = new FSController();
  }

  async start() {
    this.messagesController.sendHelloMessage(this.username);
    this.messagesController.sendLocationInfoMessage(
      this.fsController.getCurrentDir()
    );
    this._openReadline();
  }

  _openReadline() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const commands = {
      os: (arg) => {
        const argsList = {
          "--EOL": () => {
            this.messagesController.send(this.fsController.getOSEol());
            this.messagesController.sendLocationInfoMessage(
              this.fsController.getCurrentDir()
            );
          },
          "--homedir": () => {
            this.messagesController.send(this.fsController.getOSHomedir());
            this.messagesController.sendLocationInfoMessage(
              this.fsController.getCurrentDir()
            );
          },
          "--username": () => {
            this.messagesController.send(this.fsController.getOSUsername());
            this.messagesController.sendLocationInfoMessage(
              this.fsController.getCurrentDir()
            );
          },
          "--cpus": () => {
            this.messagesController.send(this.fsController.getOSCpus());
            this.messagesController.sendLocationInfoMessage(
              this.fsController.getCurrentDir()
            );
          },
          "--architecture": () => {
            this.messagesController.send(this.fsController.getOSArch());
            this.messagesController.sendLocationInfoMessage(
              this.fsController.getCurrentDir()
            );
          },

          "--help": () => {
            this.messagesController.send(this.fsController.getOSHelpText());
          },
        };

        return argsList[arg || "--help"]();
      },

      ls: async () => {
        this.messagesController.sendTable(await this.fsController.readDir());
        this.messagesController.sendLocationInfoMessage(
          this.fsController.getCurrentDir()
        );
      },

      up: async () => {
        this.fsController.up();
      },

      cd: async (arg) => {
        try {
          this.fsController.cd(arg);
        } catch (error) {
          this.messagesController.sendOperationFailedMessage();
        }
      },

      exit: () => rl.close(),
    };

    rl.on("line", (input) => {
      try {
        const [command, arg] = input.trim().split(" ");
        commands[command](arg);
      } catch (error) {
        this.messagesController.sendInvalidInputMessage();
      }
    });

    rl.on("close", () => {
      this.messagesController.sendGoodbyeMessage(this.username);
      process.exit(0);
    });
  }

  _getName() {
    const argsMap = parseArgs();
    const name = argsMap.get("username");
    return name ? name : "undefined";
  }
}

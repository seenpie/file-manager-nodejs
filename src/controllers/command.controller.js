import { textList } from "../models/index.js";
import { formatCPUsToText } from "../utils/format-CPUs-to-text.js";

const argsRegex = /(?:[^\s"]+|"[^"]*")+/g;

export class CommandController {
  constructor(outputController, fsController, username) {
    this.outputController = outputController;
    this.fsController = fsController;
    this.username = username;
  }

  async handleCommand(input) {
    const [command, ...arg] = input.split(" ")

    const commands = {
      os: this._handleOS.bind(this),
      ls: this._handleLS.bind(this),
      up: this._handleUp.bind(this),
      cd: this._handleCD.bind(this),
      cat: this._handleCat.bind(this),
      add: this._handleAdd.bind(this),
      rm: this._handleRemove.bind(this),
      rn: this._handleRename.bind(this),
      cp: this._handleCopy.bind(this),
      mv: this._handleMove.bind(this),
      hash: this._handleHash.bind(this),
      compress: this._handleCompress.bind(this),
      decompress: this._handlerDecompress.bind(this),
      exit: this._handleExit.bind(this),
    };

    try {
      if (commands[command]) {
        await commands[command](arg.join(" "));

      } else {
        this._handleInvalidInput();
      }

    } catch (error) {
      this.outputController.print(textList.operationFailed());
    }
  }

  async _handleOS(arg) {
    const osInfo = this.fsController.getOSInfo();
    const normalizedArg = arg.startsWith("--") ? arg?.toLowerCase().replace(/^--/, "") : null;

    const argsList = {
      eol: () => this.outputController.print(osInfo.eol),
      homedir: () => this.outputController.print(osInfo.homedir),
      username: () => this.outputController.print(osInfo.username),
      cpus: () => this.outputController.print(formatCPUsToText(osInfo.cpus)),
      architecture: () => this.outputController.print(osInfo.arch),
      help: () => this.outputController.print(textList.osHelp()),
    };

    (argsList[normalizedArg] || argsList["help"])();
    this._printCurrentDir();
  }

  async _handleLS() {
    const operation = await this.fsController.getFilesFromCurrentDir();

    if (!operation.success) {
      this.outputController.print(textList.operationFailed());

    } else {
      this.outputController.printTable(operation.data);
    }

    this._printCurrentDir();
  }

  async _handleUp() {
    const operation = await this.fsController.up();
    this._printOperationResult(operation);
  }

  async _handleCD(arg) {
    const operation = await this.fsController.cd(arg);
    this._printOperationResult(operation);
  }

  async _handleCat(arg) {
    const fileStreamOperation = this.fsController.createReadStream(arg);

    if (!fileStreamOperation.success) {
      this.outputController.print(textList.operationFailed());
    }

    const operation = await this.outputController.printStream(fileStreamOperation.data);
    this._printOperationResult(operation);
  }

  async _handleAdd(arg) {
    const operation = await this.fsController.createFile(arg);
    this._printOperationResult(operation);
  }

  async _handleRemove(arg) {
    const operation = await this.fsController.removeFile(arg);
    this._printOperationResult(operation);
  }

  async _handleRename(args) {
    const [oldPath, newPath] = this._parseArgs(args);

    if (!oldPath || !newPath) {
      this._handleInvalidInput();
      return;
    }

    const operation = await this.fsController.renameFile({ oldPath, newPath });
    this._printOperationResult(operation);
  }

  async _handleCopy(args) {
    const [srcPath, destPath] = this._parseArgs(args);

    if (!srcPath || !destPath) {
      this._handleInvalidInput();
      return;
    }

    const operation = await this.fsController.copyFile({ srcPath, destPath });
    this._printOperationResult(operation);
  }

  async _handleMove(args) {
    const [srcPath, destPath] = this._parseArgs(args);

    if (!srcPath || !destPath) {
      this._handleInvalidInput();
      return;
    }

    const operation = await this.fsController.moveFile({ srcPath, destPath });
    this._printOperationResult(operation);
  }

  async _handleHash(arg) {
    const operation = await this.fsController.calculateHash(arg);
    this._printOperationResult(operation);
  }

  async _handleCompress(args) {
    const [srcPath, destPath] = this._parseArgs(args);

    if (!srcPath || !destPath) {
      this._handleInvalidInput();
      return;
    }

    const operation = await this.fsController.brotliCompress({ srcPath, destPath });
    this._printOperationResult(operation);
  }

  async _handlerDecompress(args) {
    const [srcPath, destPath] = this._parseArgs(args);

    if (!srcPath || !destPath) {
      this._handleInvalidInput();
      return;
    }

    const operation = await this.fsController.brotliDecompress({ srcPath, destPath });
    this._printOperationResult(operation);
  }

  _handleExit() {
    this.outputController.print(textList.goodbye(this.username));
    process.exit(0);
  }

  _parseArgs(args) {
    const parsedArgs = args.match(argsRegex)?.map((arg) => arg.replace(/"/g, ""));
    return parsedArgs?.length === 2 ? parsedArgs : [null, null];
  }

  _handleInvalidInput() {
    this.outputController.print(textList.invalidInput());
    this._printCurrentDir();
  }

  _printOperationResult(operation) {
    if (!operation.success) {
      this.outputController.print(textList.operationFailed());
    }

    if (typeof operation.data === "string") {
      this.outputController.print(operation.data);
    }

    this._printCurrentDir();
  }

  _printCurrentDir() {
    this.outputController.print(textList.location(this.fsController.getCurrentDir()));
  }
}
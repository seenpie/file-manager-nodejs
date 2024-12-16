import os from "os";
import path from "path";
import { createReadStream, promises as fs, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createHash } from "crypto";
import { createBrotliDecompress, createBrotliCompress } from "zlib";

const BROTLI_COMPRESS = 1;
const BROTLI_DECOMPRESS = 0;

export class FsController {
  constructor() {
    this._setCurrentDir(this._getOSHomedir());
  }

  getCurrentDir() {
    return process.cwd();
  }

  async up() {
    const currentDir = this.getCurrentDir();
    const pathParts = currentDir.split(path.sep);

    if (pathParts.length > 1) {
      try {
        pathParts.pop();
        const newDir = pathParts.length === 1 ? `${pathParts[0]}${path.sep}` : pathParts.join(path.sep);
        this._setCurrentDir(newDir);

        return this._getReturnObject(true);

      } catch (error) {
        return this._getReturnObject(false, error);
      }
    }
  }

  async cd(dirname) {
    try {
      const newDir = dirname.match(/^[a-zA-Z]:$/) ? `${dirname}${path.sep}` : path.resolve(this.getCurrentDir(), dirname);
      this._setCurrentDir(newDir);

      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async getFilesFromCurrentDir() {
    try {
      const files = await fs.readdir(this.getCurrentDir(), { withFileTypes: true });
      const sortedFiles = files
        .map((file) => ({
          name: file.name,
          type: file.isFile() ? "file" : "directory",
        }))
        .sort((a, b) => {
          if (a.type === "directory" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "directory") return 1;
        });

      return this._getReturnObject(true, null, sortedFiles);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  createReadStream(fileName) {
    const filePath = path.resolve(this.getCurrentDir(), fileName);

    try {
      const stream = createReadStream(filePath)
      return this._getReturnObject(true, null, stream);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  createWriteStream(outputFilePath) {
    try {
      const writeStream = createWriteStream(outputFilePath);
      return this._getReturnObject(true, null, writeStream);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async createFile(fileName, content = "") {
    const filePath = this._getAbsoluteFilePath(fileName);

    try {
      await fs.writeFile(filePath, content, { flag: "wx" });
      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async removeFile(fileName) {
    const filePath = this._getAbsoluteFilePath(fileName);

    try {
      await fs.unlink(filePath);
      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async renameFile({ oldPath, newPath }) {
    const oldFilePath = this._getAbsoluteFilePath(oldPath);
    const newFilePath = this._getAbsoluteFilePath(newPath);

    try {
      const fileStats = await fs.stat(oldFilePath);

      if (fileStats.isFile()) {
        await fs.rename(oldFilePath, newFilePath);
        return this._getReturnObject(true);

      } else {
        return this._getReturnObject(false, new Error("this is directory"));
      }

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async copyFile({ srcPath, destPath }) {
    const srcFilePath = this._getAbsoluteFilePath(srcPath);
    const destFilePath = this._getAbsoluteFilePath(destPath);

    try {
      const srcFileStats = await fs.stat(srcFilePath);

      if (!srcFileStats.isFile()) {
        return this._getReturnObject(false, new Error("isn't a file"));
      }

      const fileName = path.basename(srcFilePath);

      const destDirStats = await fs.stat(destFilePath);

      if (!destDirStats.isDirectory()) {
        return this._getReturnObject(false, new Error("isn't a directory"));
      }

      const resDestPath = path.resolve(destFilePath, fileName);

      const pipelineOperation = await this._pipelineOperations(createReadStream(srcFilePath), createWriteStream(resDestPath));

      if (!pipelineOperation.success) {
        return this._getReturnObject(false, pipelineOperation.error);
      }

      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async moveFile({ srcPath, destPath }) {
    const copyOperationResult = await this.copyFile({ srcPath, destPath });

    if (!copyOperationResult.success) {
      return copyOperationResult;
    }

    const removeOperationResult = await this.removeFile(srcPath);

    if (!removeOperationResult.success) {
      return this._getReturnObject(false, new Error("file copied, but failed to remove the original file", { cause: removeOperationResult.error }));
    }

    return this._getReturnObject(true);
  }

  async calculateHash(filePath) {
    const absPath = this._getAbsoluteFilePath(filePath);
    const operation = this.createReadStream(absPath);

    if (!operation.success) {
      return operation;
    }

    const readStream = operation.data;
    const hash = createHash("sha256");

    const pipelineOperation = await this._pipelineOperations(readStream, hash);

    if (!pipelineOperation.success) {
      return this._getReturnObject(false, pipelineOperation.error);
    }

    return this._getReturnObject(true, null, hash.digest("hex"));
  }

  async brotliCompress({ srcPath, destPath }) {
    return await this._brotli(BROTLI_COMPRESS, { srcPath, destPath });
  }

  async brotliDecompress({ srcPath, destPath }) {
    return await this._brotli(BROTLI_DECOMPRESS ,{ srcPath, destPath });
  }

  async _brotli(operationType, { srcPath, destPath }) {
    const absSrcPath = this._getAbsoluteFilePath(srcPath);
    const absDestPath = this._getAbsoluteFilePath(destPath);
    const writeStreamArg = operationType ? `${absDestPath}.br` : absDestPath;
    const brotliFunc = operationType ? createBrotliCompress : createBrotliDecompress;

    try {
      const srcFileStats = await fs.stat(absSrcPath);

      if (!srcFileStats.isFile()) {
        return this._getReturnObject(false, new Error("isn't a file"));
      }

      const accessOperation = await this._checkAccessFile(writeStreamArg);

      if (accessOperation.success) {
        const destPathStats = await fs.stat(writeStreamArg);

        if (!destPathStats.isDirectory()) {
          return this._getReturnObject(false, new Error("file already exists"));
        }

        return this._getReturnObject(false, new Error("file name didn't type"));
      }

      const readStreamOperation = this.createReadStream(absSrcPath);

      if (!readStreamOperation.success) {
        return this._getReturnObject(false, readStreamOperation.error);
      }

      const writeStreamOperation = this.createWriteStream(writeStreamArg);

      if (!writeStreamOperation.success) {
        return this._getReturnObject(false, writeStreamOperation.error);
      }

      const pipelineOperation = await this._pipelineOperations(readStreamOperation.data, writeStreamOperation.data, brotliFunc());

      if (!pipelineOperation.success) {
        return this._getReturnObject(false, pipelineOperation.error);
      }

      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async _pipelineOperations(readStream, writeStream, transformer = null) {
    try {
      const streams = transformer ? [readStream, transformer, writeStream] : [readStream, writeStream];
      await pipeline(...streams);
      return this._getReturnObject(true);
    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  async _checkAccessFile(filePath) {
    try {
      await fs.access(filePath);
      return this._getReturnObject(true);

    } catch (error) {
      return this._getReturnObject(false, error);
    }
  }

  _getReturnObject(success, error = null, data = null) {
    return { success, error, data };
  }

  _setCurrentDir(newDir) {
    try {
      process.chdir(newDir);
    } catch (error) {
      throw new Error(error);
    }
  }

  _getAbsoluteFilePath(fileName) {
    return path.resolve(this.getCurrentDir(), fileName);
  }

  getOSInfo() {
    return {
      eol: this._getOSEol(),
      cpus: os.cpus(),
      homedir: this._getOSHomedir(),
      username: os.userInfo().username,
      arch: os.arch(),
    }
  }

  _getOSHomedir() {
    return os.homedir();
  }

  _getOSEol() {
    return os.EOL === "\n" ? "\\n" : "\\r\\n";
  }
}

import { pipeline } from "stream/promises";

export class OutputController {
  print(value) {
    console.log(value);
  }

  printTable(tableValue) {
    console.table(tableValue);
  }

  async printStream(stream) {
    try {
      await pipeline(stream, process.stdout, { end: false });
      console.log("");
      return { success: true, error: null };

    } catch (error) {
      return { success: false, error };
    }
  }
}

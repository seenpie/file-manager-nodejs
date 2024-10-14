import { AppController } from "./src/Controllers/AppController.js";

async function main() {
  const appController = new AppController();
  await appController.start();
}

await main();

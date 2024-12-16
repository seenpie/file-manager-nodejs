import { AppController } from "./src/controllers/app.controller.js";

async function main() {
  const appController = new AppController();
  await appController.start();
}

await main();

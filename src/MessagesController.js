const messagesList = {
  greeting: (value) => `Welcome to the File Manager, ${value}!`,
  goodbye: (value) => `Thank you for using File Manager, ${value}, goodbye!`,
  location: (value) => `You are currently in ${value}`,
  invalidInput: () => `Invalid input`,
  operationFailed: () => `Operation failed`,
};

export class MessagesController {
  send(value) {
    console.log(`${value}`);
  }

  sendTable(value) {
    console.table(value);
  }

  //common messanges
  sendHelloMessage(value) {
    this.send(messagesList.greeting(value));
  }

  sendLocationInfoMessage(value) {
    this.send(messagesList.location(value));
  }

  sendGoodbyeMessage(value) {
    this.send(messagesList.goodbye(value));
  }

  //error messages
  sendInvalidInputMessage() {
    this.send(messagesList.invalidInput());
  }

  sendOperationFailedMessage() {
    this.send(messagesList.operationFailed());
  }

  // //help messanges
  // sendOSHelp() {
  //   console.log(`
  //     OS Commands:
  //     ----------------
  //     os --EOL         : Get EOL (default system End-Of-Line)
  //     os --cpus        : Get host machine CPUs info
  //     os --homedir     : Get home directory
  //     os --username    : Get current system user name
  //     os --architecture: Get CPU architecture
  //   `);
  // }
}

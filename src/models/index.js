export const textList = {
  greeting: (value) => `Welcome to the File Manager, ${value}!`,
  goodbye: (value) => `Thank you for using File Manager, ${value}, goodbye!`,
  location: (value) => `You are currently in ${value}`,
  invalidInput: () => `Invalid input`,
  operationFailed: () => `Operation failed`,
  osHelp: () => `OS Commands:\n----------------\nos --EOL         : get End-Of-Line\nos --cpus        : get host machine CPUs info\nos --homedir     : get home directory\nos --username    : get current system user name\nos --architecture: get CPU architecture`,
};
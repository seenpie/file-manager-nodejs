export function parseArgs() {
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

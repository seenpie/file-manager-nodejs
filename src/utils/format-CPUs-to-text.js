export function formatCPUsToText(cpus) {
  return cpus
    .reduce(
      (acc, current) => {
        const string = `model: ${current.model}\nclock rate: ${(
          current.speed / 1000
        ).toFixed(2)}GHz`;
        acc.push(string);
        return acc;
      },
      [`overall amount of CPUS: ${cpus.length}`]
    )
    .join("\n");
}
import { fileURLToPath } from "url";
import path from "path";

export function getLocationsConst(url) {
  const __filename = fileURLToPath(url);
  const __dirname = path.dirname(__filename);
  return { __dirname, __filename };
}

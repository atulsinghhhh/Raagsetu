import fs from "node:fs";
import path from "node:path";

const POSSIBLE_PATHS = [
  path.join(process.cwd(), "cookies.txt"),
  path.join(process.cwd(), "src", "cookies.txt"),
  "/app/cookies.txt",
  "/etc/secrets/cookies.txt" // Render Secret File path
];

/**
 * Returns the first existing cookies file path, or null.
 */
export function findCookiesFile() {
  for (const p of POSSIBLE_PATHS) {
    if (fs.existsSync(p)) {
      // Check if file is not empty
      try {
        const stats = fs.statSync(p);
        if (stats.size > 0) return p;
      } catch (e) {
        // ignore
      }
    }
  }
  return null;
}

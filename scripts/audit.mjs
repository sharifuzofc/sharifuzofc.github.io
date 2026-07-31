/**
 * Audit script: build → vite preview → lighthouse
 *
 * Runs: npx lighthouse http://localhost:4173 --chrome-flags="--headless"
 *       --output=json --output-path=./lighthouse-report.json --quiet
 */
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 4173;
const URL = `http://localhost:${PORT}`;
const LIGHTHOUSE_CMD = [
  "lighthouse",
  URL,
  '--chrome-flags="--headless"',
  "--output=json",
  "--output-path=./lighthouse-report.json",
  "--quiet",
];

console.log("Building site…");
execSync("npm run build", { stdio: "inherit" });

console.log(`Starting preview on ${URL}…`);
const preview = spawn("npx", ["vite", "preview", "--port", String(PORT)], {
  stdio: "pipe",
  shell: true,
});

let previewReady = false;
preview.stdout?.on("data", (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  if (text.includes("Local:")) previewReady = true;
});

const deadline = Date.now() + 30_000;
while (!previewReady && Date.now() < deadline) {
  await sleep(250);
}

if (!previewReady) {
  preview.kill();
  console.error("Preview server did not start in time.");
  process.exit(1);
}

await sleep(1500);

try {
  console.log("Running Lighthouse…");
  execSync(`npx ${LIGHTHOUSE_CMD.join(" ")}`, { stdio: "inherit", shell: true });
  console.log("Lighthouse report saved to ./lighthouse-report.json");
} finally {
  preview.kill();
}

// Copy only AI settings from backend .env; do not load template keys from it.
const { spawn } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const root = resolve(__dirname, "..");
const local = require("../server/node_modules/dotenv").parse(
  readFileSync(resolve(root, "server/.env")),
);
const env = { ...process.env };
for (const key of ["AI_FACE_SERVICE_TOKEN", "FACE_MODEL_DIR"]) {
  if (env[key] === undefined && local[key] !== undefined) env[key] = local[key];
}
env.BACKEND_API_URL = "http://127.0.0.1:3000/api";
const child = spawn(
  resolve(root, "ai-service/.venv/bin/python"),
  [
    "-m",
    "uvicorn",
    "main:app",
    "--host",
    "0.0.0.0",
    "--port",
    "8000",
    "--reload",
    "--reload-exclude",
    ".venv",
  ],
  { cwd: resolve(root, "ai-service"), env, stdio: "inherit" },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("error", () => {
  console.error("FastAPI launch failed");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

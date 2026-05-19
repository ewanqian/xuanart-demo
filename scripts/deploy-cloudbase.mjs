import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import "./load-local-env.mjs";

const envId = process.env.TCB_ENV_ID;
if (!envId) {
  console.error("Missing TCB_ENV_ID. Example: TCB_ENV_ID=xxx npm run cloud:deploy:cloudbase");
  process.exit(1);
}

if (!existsSync("dist/index.html")) {
  console.error("dist/index.html not found. Run npm run build first.");
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const login = spawnSync(command, ["tcb", "login", "--key"], {
  stdio: "inherit",
  env: process.env,
});
if (login.status !== 0) process.exit(login.status || 1);

const deploy = spawnSync(command, ["tcb", "hosting", "deploy", "dist", "-e", envId], {
  stdio: "inherit",
  env: process.env,
});
process.exit(deploy.status || 0);

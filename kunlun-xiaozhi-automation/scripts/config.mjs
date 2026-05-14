import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

export const botUrl =
  process.env.KUNLUN_BOT_URL ||
  "https://xz.klszkj.com:9000/botapi/jump?lang=zh-CN&open_in_browser=true&convId=01KRJPFNYYDFNNB7K6R2P9EAJF&redirect=/v4/chat/0OMP0NFfygLyc9Nr6qvsV-";

export const questions = process.env.KUNLUN_QUESTIONS
  ? process.env.KUNLUN_QUESTIONS.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  : [process.env.KUNLUN_QUESTION || "今天是星期几。", "你好"];

export const storageStatePath =
  process.env.KUNLUN_STORAGE_STATE_PATH ||
  path.join(projectRoot, "auth", "storage-state.json");

export const artifactsDir =
  process.env.KUNLUN_ARTIFACTS_DIR || path.join(projectRoot, "artifacts");

export const headless = process.env.HEADLESS !== "false";

export const navigationTimeoutMs = Number(process.env.NAVIGATION_TIMEOUT_MS || 60000);

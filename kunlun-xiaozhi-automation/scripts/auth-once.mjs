import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "playwright";
import {
  botUrl,
  navigationTimeoutMs,
  storageStatePath
} from "./config.mjs";
import {
  clickLikelyAuthButtons,
  ensureDir,
  storageStateExists
} from "./browser-helpers.mjs";
import path from "node:path";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  storageState: (await storageStateExists(storageStatePath)) ? storageStatePath : undefined
});
const page = await context.newPage();
page.setDefaultTimeout(navigationTimeoutMs);

await page.goto(botUrl, { waitUntil: "domcontentloaded", timeout: navigationTimeoutMs });
await clickLikelyAuthButtons(page);

const rl = readline.createInterface({ input, output });
await rl.question("请在打开的浏览器里完成昆仑智联授权/登录。确认已经进入问答页后，回到这里按 Enter 保存登录态...");
rl.close();

await ensureDir(path.dirname(storageStatePath));
await context.storageState({ path: storageStatePath });
await browser.close();

console.log(`登录态已保存到: ${storageStatePath}`);

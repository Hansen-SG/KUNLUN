import { chromium } from "playwright";
import {
  artifactsDir,
  botUrl,
  headless,
  navigationTimeoutMs,
  question,
  storageStatePath
} from "./config.mjs";
import {
  applyStorageSecret,
  clickLikelyAuthButtons,
  fillComposer,
  findComposer,
  saveFailureArtifacts,
  storageStateExists,
  submitQuestion
} from "./browser-helpers.mjs";

await applyStorageSecret(storageStatePath);

if (!(await storageStateExists(storageStatePath))) {
  throw new Error(
    "缺少登录态。请先运行 npm run auth，或在云端设置 KUNLUN_STORAGE_STATE_B64。"
  );
}

const browser = await chromium.launch({ headless });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();
page.setDefaultTimeout(navigationTimeoutMs);

try {
  await page.goto(botUrl, { waitUntil: "domcontentloaded", timeout: navigationTimeoutMs });
  await clickLikelyAuthButtons(page);

  const composer = await findComposer(page);
  await fillComposer(composer, question);
  await submitQuestion(page, composer);
  await page.waitForTimeout(5000);

  await context.storageState({ path: storageStatePath });
  console.log(`已发送问题: ${question}`);
} catch (error) {
  const artifacts = await saveFailureArtifacts(page, artifactsDir, "failure");
  console.error("发送失败:", error);
  console.error("调试文件:", artifacts);
  throw error;
} finally {
  await browser.close();
}

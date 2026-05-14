import { chromium } from "playwright";
import {
  artifactsDir,
  botUrl,
  headless,
  navigationTimeoutMs,
  questions,
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

  for (const question of questions) {
    const composer = await findComposer(page);
    await fillComposer(composer, question);
    await submitQuestion(page, composer);
    await page.waitForTimeout(5000);
    console.log(`已发送问题: ${question}`);
  }

  await context.storageState({ path: storageStatePath });
} catch (error) {
  const artifacts = await saveFailureArtifacts(page, artifactsDir, "failure");
  const title = await page.title().catch(() => "");
  const text = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  console.error("发送失败:", error);
  console.error("当前页面:", { url: page.url(), title });
  console.error("页面文本片段:", text.replace(/\s+/g, " ").slice(0, 1000));
  console.error("调试文件:", artifacts);
  throw error;
} finally {
  await browser.close();
}

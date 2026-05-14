import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function applyStorageSecret(storageStatePath) {
  const gzipEncoded = process.env.KUNLUN_STORAGE_STATE_GZIP_B64;
  const plainEncoded = process.env.KUNLUN_STORAGE_STATE_B64;
  if (!gzipEncoded && !plainEncoded) return false;

  await ensureDir(path.dirname(storageStatePath));
  const json = gzipEncoded
    ? gunzipSync(Buffer.from(gzipEncoded, "base64")).toString("utf8")
    : Buffer.from(plainEncoded, "base64").toString("utf8");
  JSON.parse(json);
  await fs.writeFile(storageStatePath, json, "utf8");
  return true;
}

export async function storageStateExists(storageStatePath) {
  try {
    await fs.access(storageStatePath);
    return true;
  } catch {
    return false;
  }
}

export async function clickLikelyAuthButtons(page) {
  const candidates = [
    /昆仑智联授权/,
    /授权/,
    /同意/,
    /允许/,
    /确认/,
    /继续/,
    /登录/
  ];

  for (let round = 0; round < 4; round += 1) {
    let clicked = false;
    for (const pattern of candidates) {
      const target = page
        .getByRole("button", { name: pattern })
        .or(page.getByRole("link", { name: pattern }))
        .or(page.locator("button,a,[role='button'],[onclick]").filter({ hasText: pattern }))
        .first();
      try {
        if (await target.isVisible({ timeout: 1200 })) {
          await target.click({ timeout: 5000 });
          await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(1500);
          clicked = true;
          break;
        }
      } catch {
        // Try the next candidate. Login surfaces can vary between deployments.
      }
    }
    if (!clicked) break;
  }
}

export async function findComposer(page) {
  const selectors = [
    "textarea[placeholder*='问']",
    "textarea[placeholder*='输入']",
    "textarea:not([disabled])",
    "[contenteditable='true']",
    "[role='textbox']",
    "input:not([type='hidden']):not([type='password']):not([disabled])"
  ];

  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const locator = frame.locator(selector);
      try {
        await locator.first().waitFor({ state: "attached", timeout: 3000 });
      } catch {
        // Continue to the next selector.
        continue;
      }

      const count = await locator.count();
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        try {
          if (await candidate.isVisible({ timeout: 500 })) {
            return candidate;
          }
        } catch {
          // Continue to the next candidate.
        }
      }
    }
  }

  throw new Error("未找到可输入问题的问答框。");
}

export async function fillComposer(composer, text) {
  const tagName = await composer.evaluate((node) => node.tagName.toLowerCase());
  const isContentEditable = await composer.evaluate((node) => node.isContentEditable);

  if (tagName === "textarea" || tagName === "input") {
    await composer.fill(text);
    return;
  }

  if (isContentEditable) {
    await composer.click();
    await composer.page().keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await composer.page().keyboard.type(text);
    return;
  }

  await composer.click();
  await composer.page().keyboard.type(text);
}

export async function submitQuestion(page, composer) {
  const sendButton = page
    .getByRole("button", { name: /发送|提交|send/i })
    .or(page.locator("button[aria-label*='发送'],button[title*='发送']"))
    .last();

  try {
    if (await sendButton.isVisible({ timeout: 1500 })) {
      await sendButton.click({ timeout: 5000 });
      return;
    }
  } catch {
    // Fall back to keyboard submission.
  }

  await composer.press("Enter");
}

export async function saveFailureArtifacts(page, artifactsDir, label) {
  await ensureDir(artifactsDir);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshot = path.join(artifactsDir, `${stamp}-${label}.png`);
  const html = path.join(artifactsDir, `${stamp}-${label}.html`);
  await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
  await fs.writeFile(html, await page.content(), "utf8").catch(() => {});
  return { screenshot, html };
}

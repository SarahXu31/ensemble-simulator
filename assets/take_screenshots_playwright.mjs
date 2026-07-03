import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2];
const baseUrl = process.argv[3];
if (!outDir || !baseUrl) {
  console.error('Usage: node take_screenshots_playwright.mjs <outDir> <baseUrl>');
  process.exit(1);
}

const shots = [];
const ensureDir = async (p) => fs.mkdir(p, { recursive: true });

const tryGoto = async (page, url) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return true;
  } catch (e) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return true;
    } catch {
      return false;
    }
  }
};

const tryClickByText = async (page, texts) => {
  for (const t of texts) {
    try {
      const locator = page.getByText(t, { exact: false }).first();
      if (await locator.count()) {
        await locator.click({ timeout: 3000 });
        await page.waitForTimeout(1500);
        return true;
      }
    } catch {}
  }
  return false;
};

const main = async () => {
  await ensureDir(outDir);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1) World / main
  await tryGoto(page, baseUrl);
  await page.waitForTimeout(5000);
  const p1 = path.join(outDir, 'screenshot-1-world.png');
  await page.screenshot({ path: p1, fullPage: true });
  shots.push(p1);

  // 2) Characters
  let okCharacters = false;
  okCharacters = await tryClickByText(page, ['角色', '角色配置', '角色编辑', 'Characters', 'Character']);
  if (!okCharacters) {
    const candidateUrls = [
      baseUrl.replace(/\/$/, '') + '/characters',
      baseUrl.replace(/\/$/, '') + '/character',
      baseUrl.replace(/\/$/, '') + '/#/characters',
      baseUrl.replace(/\/$/, '') + '/#/character',
      baseUrl.replace(/\/$/, '') + '?tab=characters',
    ];
    for (const u of candidateUrls) {
      if (await tryGoto(page, u)) { okCharacters = true; break; }
    }
  }
  if (okCharacters) {
    await page.waitForTimeout(2500);
    const p2 = path.join(outDir, 'screenshot-2-characters.png');
    await page.screenshot({ path: p2, fullPage: true });
    shots.push(p2);
  }

  // 3) Chat / Relations
  let okChat = false;
  okChat = await tryClickByText(page, ['对话', '关系', '聊天', 'Chat', 'Dialogue', 'Relations', 'Relationship']);
  if (!okChat) {
    const candidateUrls = [
      baseUrl.replace(/\/$/, '') + '/chat',
      baseUrl.replace(/\/$/, '') + '/dialogue',
      baseUrl.replace(/\/$/, '') + '/relations',
      baseUrl.replace(/\/$/, '') + '/relationship',
      baseUrl.replace(/\/$/, '') + '/#/chat',
      baseUrl.replace(/\/$/, '') + '/#/relations',
      baseUrl.replace(/\/$/, '') + '?tab=chat',
      baseUrl.replace(/\/$/, '') + '?tab=relations',
    ];
    for (const u of candidateUrls) {
      if (await tryGoto(page, u)) { okChat = true; break; }
    }
  }
  if (okChat) {
    await page.waitForTimeout(2500);
    const p3 = path.join(outDir, 'screenshot-3-chat.png');
    await page.screenshot({ path: p3, fullPage: true });
    shots.push(p3);
  }

  await browser.close();

  // print results for the caller
  console.log(JSON.stringify({ shots }, null, 2));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

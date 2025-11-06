#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const axeSource = require("axe-core").source;

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ].filter(Boolean);
  const fsSync = require("fs");
  for (const c of candidates) {
    try {
      if (fsSync.existsSync(c)) return c;
    } catch (e) {}
  }
  return null;
}

async function run(url) {
  const chromePath = await findChrome();
  if (!chromePath) {
    console.error(
      "No Chrome/Chromium binary found. Set CHROME_PATH env or install Chrome/Chromium."
    );
    process.exitCode = 2;
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
  const page = await browser.newPage();
  const reportsDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const consoleLogs = [];
  page.on("console", msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", err => consoleLogs.push({ type: "pageerror", text: err.message }));

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    // inject axe
    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => await axe.run());
    fs.writeFileSync(path.join(reportsDir, "axe-remote.json"), JSON.stringify(results, null, 2));
    fs.writeFileSync(
      path.join(reportsDir, "console-remote.json"),
      JSON.stringify(consoleLogs, null, 2)
    );
    await page.screenshot({
      path: path.join(process.cwd(), "__remote_screenshot.png"),
      fullPage: true,
    });
    console.log("Audit complete. Reports written to", reportsDir);
  } catch (err) {
    console.error("Audit failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

const url = process.argv[2] || process.env.TARGET_URL;
if (!url) {
  console.error("Usage: node scripts/audit-remote.js <https://your-url>");
  process.exit(2);
}
run(url).catch(e => {
  console.error(e);
  process.exit(1);
});

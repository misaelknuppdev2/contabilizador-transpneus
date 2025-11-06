const fs = require("fs");
const path = require("path");
const { HTMLHint } = require("htmlhint");
const { ESLint } = require("eslint");
const puppeteer = require("puppeteer-core");

(async function main() {
  const root = path.resolve(__dirname);
  const htmlPath = path.join(root, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  console.log("=== HTMLHint (html) ===");
  const htmlHints = HTMLHint.verify(html, {});
  if (htmlHints.length === 0) console.log("No HTMLHint issues");
  else
    htmlHints.forEach(h =>
      console.log(`${h.line}:${h.col} [${h.type}] ${h.message} (${h.rule.id})`)
    );

  // extract inline <script>...</script>
  const scripts = [];
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    const content = m[1].trim();
    if (content) scripts.push(content);
  }

  if (scripts.length > 0) {
    console.log("\n=== ESLint (inline scripts) ===");
    const eslint = new ESLint({ cwd: root });
    for (let i = 0; i < scripts.length; i++) {
      const text = scripts[i];
      try {
        const results = await eslint.lintText(text, { filePath: `inline-${i}.js` });
        const formatter = await eslint.loadFormatter("stylish");
        const resultText = formatter.format(results);
        if (resultText.trim()) console.log(`-- script #${i}\n${resultText}`);
        else console.log(`-- script #${i}: no issues`);
      } catch (err) {
        console.error("ESLint error:", err);
      }
    }
  } else {
    console.log("\nNo inline scripts found to lint.");
  }

  // Puppeteer: open the local file and capture console and page errors
  console.log("\n=== Puppeteer (runtime console + errors) ===");

  // try to find a local Chrome/Chromium binary; allow override with CHROME_BIN or CHROME_PATH
  function findChromeBinary() {
    const envPath = process.env.CHROME_BIN || process.env.CHROME_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;
    const candidates = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return p;
      } catch (e) {}
    }
    return null;
  }

  const chromePath = findChromeBinary();
  let msgs = [];
  if (!chromePath) {
    console.warn(
      "No Chrome/Chromium binary found. Skipping Puppeteer runtime checks. Set CHROME_BIN env var to the browser binary to enable them."
    );
  } else {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
      const page = await browser.newPage();
      msgs = [];
      // msgs initialized for this page
      msgs = [];
    page.on("console", msg => {
      const text = msg.text();
      console.log("PAGE CONSOLE:", text);
      msgs.push({ type: "console", text });
    });
    page.on("pageerror", err => {
      console.error("PAGE ERROR:", err.stack || err.toString());
      msgs.push({ type: "error", text: err.stack || err.toString() });
    });

    const url = "file://" + htmlPath;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 10000 });
        // wait a bit for any async code
        await page.waitForTimeout(800);

        // run axe-core accessibility audit (inject axe and run)
        try {
          const axe = require('axe-core');
          await page.addScriptTag({ content: axe.source });
          const axeResults = await page.evaluate(async () => await axe.run());
          if (axeResults.violations && axeResults.violations.length > 0) {
            console.log('\n=== axe-core accessibility violations ===');
            axeResults.violations.forEach((v, i) => {
              console.log(`${i + 1}. ${v.id} (${v.impact}) - ${v.help}`);
              v.nodes.forEach(n => console.log('  target:', n.target.join(', ')));
            });
            // write report to disk
            try {
              const reportsDir = path.join(root, 'reports');
              if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
              fs.writeFileSync(path.join(reportsDir, 'axe-report.json'), JSON.stringify(axeResults, null, 2), 'utf8');
            } catch (e) {
              console.warn('Could not write axe report:', e && e.message ? e.message : e);
            }
          } else {
            console.log('\n=== axe-core: no accessibility violations found ===');
          }
        } catch (e) {
          console.warn('axe-core run skipped or failed:', e && e.message ? e.message : e);
        }

        // take screenshot for visual debugging
        const ss = path.join(root, "__page_screenshot.png");
        await page.screenshot({ path: ss, fullPage: true });
        console.log("Screenshot saved to", ss);
      } catch (err) {
        console.error("Error opening page:", err.message || err);
      } finally {
        await browser.close();
      }
  }

  // summary
  const errors = msgs.filter(m => m.type === "error");
  console.log("\n=== Summary ===");
  console.log("Console messages captured:", msgs.length);
  console.log("Page errors captured:", errors.length);
  if (errors.length > 0) errors.forEach((e, i) => console.log(i + 1, e.text));

  if (errors.length > 0) process.exitCode = 2;
  else process.exitCode = 0;
})();

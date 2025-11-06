#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer-core');

const iconsDir = path.resolve(__dirname, '..', 'icons');
const inputs = [
  { svg: path.join(iconsDir, 'icon-192.svg'), sizes: [{w:192,h:192, out: path.join(iconsDir,'icon-192.png')} ] },
  { svg: path.join(iconsDir, 'icon-512.svg'), sizes: [{w:512,h:512, out: path.join(iconsDir,'icon-512.png')} ] },
];

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium'
  ].filter(Boolean);
  const fsSync = require('fs');
  for (const c of candidates) {
    try {
      if (fsSync.existsSync(c)) return c;
    } catch (e) {}
  }
  return null;
}

async function render() {
  const chromePath = await findChrome();
  if (!chromePath) {
    console.error('No Chrome/Chromium binary found. Set CHROME_PATH env or install Chrome/Chromium.');
    process.exitCode = 2;
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    for (const item of inputs) {
      const svg = await fs.readFile(item.svg, 'utf8');
      for (const s of item.sizes) {
        const page = await browser.newPage();
        await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
        const content = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;height:100%;}svg{width:100%;height:100%;display:block;}</style></head><body>${svg}</body></html>`;
        await page.setContent(content, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: s.out });
        await page.close();
        console.log('Wrote', s.out);
      }
    }
  } finally {
    await browser.close();
  }
}

render().catch(err => { console.error(err); process.exitCode = 1; });

/**
 * Generates docs/PROJECT_REPORT.pdf from docs/report-print.html
 * Requires: npm install puppeteer --save-dev
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'report-print.html');
const outPath = path.join(root, 'docs', 'PROJECT_REPORT.pdf');

async function main() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Install puppeteer: npm install puppeteer --save-dev');
    process.exit(1);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    console.log('Wrote', outPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

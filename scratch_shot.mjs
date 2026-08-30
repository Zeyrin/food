import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const [w,h,name] of [[1440,900,'desktop'],[390,844,'mobile']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `C:/Users/maceo/AppData/Local/Temp/bienvenue-${name}.png` });
  await page.close();
}
await browser.close();

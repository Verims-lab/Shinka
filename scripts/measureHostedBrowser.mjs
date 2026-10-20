// Explicit manual acceptance command; never called by package checks or Full Health.
import { chromium, webkit } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { collectBrowserMeasurements } from './browserMeasurements.mjs';
const [origin, output, engine='chromium'] = process.argv.slice(2);
if(!origin||!output||new URL(origin).protocol!=='https:'||!['chromium','webkit'].includes(engine)) throw new Error('Usage: node scripts/measureHostedBrowser.mjs https://app-origin /absolute/evidence.json [chromium|webkit]');
const browser=await ({chromium,webkit}[engine]).launch({headless:false});
try {
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto(new URL('/internal/health',origin).href);
 process.stdout.write('Sign in as admin in the opened browser. No password/token is collected by this script.\n');
 await page.waitForSelector('[data-probe-identity]',{state:'attached',timeout:180000});
 await page.waitForFunction(()=>!!document.querySelector('[data-probe-identity]')?.textContent);
 const identity=JSON.parse(await page.locator('[data-probe-identity]').textContent());
 const bundle=await collectBrowserMeasurements(browser,new URL(origin).origin,identity,engine,context);
 await writeFile(output,JSON.stringify(bundle,null,2));
 process.stdout.write(`Saved ${bundle.measurements.length} measurements. Import JSON in Health Center before the manual run.\n`);
} finally {await browser.close();}

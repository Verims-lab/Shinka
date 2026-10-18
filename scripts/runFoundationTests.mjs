// One canonical test set, executed in a real browser for the existing DOM probes.
// No Base44 credentials, platform calls, or live enforcement claims.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { staticEvidencePlugin } from "./staticEvidence.mjs";
import { captureFoundationVisuals } from "./captureFoundationVisuals.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=await mkdtemp(path.join(tmpdir(),"shinka-foundation-tests-"));
let server,browser;
try {
  await build({root,configFile:false,plugins:[staticEvidencePlugin(root),tailwindcss(),react()],logLevel:"warn",
    resolve:{alias:[{find:"@/api/base44Client",replacement:path.join(root,"scripts/testHarness/fakeBase44.js")},{find:"@",replacement:path.join(root,"src")}]},
    build:{outDir:output,emptyOutDir:true,rollupOptions:{input:path.join(root,"scripts/testHarness/index.html")}}});
  const html=await readFile(path.join(output,"scripts/testHarness/index.html"));
  server=createServer(async(req,res)=>{
    try {
      const pathname=new URL(req.url,"http://localhost").pathname;
      if(!pathname.startsWith("/assets/")){res.setHeader("Content-Type","text/html");res.end(html);return;}
      const file=path.resolve(output,`.${pathname}`);
      if(!file.startsWith(`${output}${path.sep}`)){res.writeHead(403).end();return;}
      res.setHeader("Content-Type",file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":"application/octet-stream");
      res.end(await readFile(file));
    } catch {res.writeHead(404).end();}
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.emulateMedia({colorScheme:"dark"}); // Product stays light even when the OS prefers dark.
  await page.route("**/*",route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.message));
  if(process.env.FOUNDATION_VISUAL_DIR){await captureFoundationVisuals(page,origin,path.resolve(process.env.FOUNDATION_VISUAL_DIR));await page.setViewportSize({width:1280,height:900});}
  await page.goto(`${origin}/internal/health`);
  await page.waitForSelector("[data-health-root]");
  const results=await page.evaluate(()=>window.__runFoundationTests());
  for(const result of results) console.log(`${result.passed?"PASS":"FAIL"} ${result.id} ${result.name}${result.passed?"":` — ${result.detail}`}`);
  const health=await page.evaluate(()=>window.__staticHealthEvidence());
  const catalog=await page.evaluate(()=>window.__foundationCatalog);
  console.log(JSON.stringify({evidenceScope:"LOCAL_BROWSER_SYNTHETIC_AND_BUILD_TIME_STATIC",catalog,tests:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,health,pageErrors},null,2));
  if(results.length===0||results.some(r=>!r.passed)||health.some(c=>c.status!=="PASS")||pageErrors.length) process.exitCode=1;
} catch(error){console.error(error);process.exitCode=1;}
finally {await browser?.close();if(server) await new Promise(resolve=>server.close(resolve));await rm(output,{recursive:true,force:true});}

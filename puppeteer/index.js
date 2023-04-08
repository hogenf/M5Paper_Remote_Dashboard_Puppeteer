// based on https://www.howtogeek.com/devops/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/

import puppeteer from 'puppeteer';
import { execFileSync } from 'child_process';
import { renameSync } from 'fs';
import cron from 'node-cron';

const URL = process.env.URL;
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const CRON=process.env.CRON || "*/15 * * * *";
const WAIT_FOR_PAGE_MS = Number(process.env.WAIT_FOR_PAGE_MS || 5000);
const OUTPUT_DIR=process.env.OUTPUT_DIR || "/output";
const VIEWPORT_WIDTH=Number(process.env.VIEWPORT_WIDTH || 1024);
const VIEWPORT_HEIGHT=Number(process.env.VIEWPORT_HEIGHT || 768);

if (!URL) {
 console.error("Missing URL environment variable.")
 process.exit(1);
}

const log = txt => {
  console.log(new Date() + ": " + txt);
}

const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    args: [
//        "--disable-gpu",
//        "--disable-dev-shm-usage",
//        "--disable-setuid-sandbox",
        "--no-sandbox",
    ]
});


async function fetch() {
  log("Fetching " + URL);

  const page = await browser.newPage();

  // set the HTTP Basic Authentication credential
  if (BASIC_AUTH_USERNAME) {
    await page.authenticate({'username': BASIC_AUTH_USERNAME, 'password': BASIC_AUTH_PASSWORD});
  }
  await page.goto(URL);

  log("Waiting for " + WAIT_FOR_PAGE_MS + "ms until page is rendered.");
  await page.waitForTimeout(WAIT_FOR_PAGE_MS);

  const ss = await page.screenshot({path: "screenshot.png"});
  log("Screenshot created.");

  await page.close();

  execFileSync("convert", ["screenshot.png", OUTPUT_DIR + "/screenshot.tmp.jpg"]);
  log("Converted png -> .tmp.jpg");

  renameSync(OUTPUT_DIR + "/screenshot.tmp.jpg", OUTPUT_DIR + "/screenshot.jpg"); 
  log("Renamed .tmp.jpg to /output/screenshot.jpg");
  log("---------------------------------------");

}

log("Initial fetch...");
await fetch(); // on startup, execute fetch regardless of schedule
log("---------------------------------------");

// intall cron jobs
CRON.split(";").forEach(c => {
  c = c.trim();
  log("Scheduling " + c);
  cron.schedule(c, async () => await fetch());
});
log("---------------------------------------");

// the CRON job will never end unless container is terminated
//await browser.close();

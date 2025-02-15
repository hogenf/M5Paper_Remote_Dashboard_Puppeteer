// based on https://www.howtogeek.com/devops/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/

import puppeteer from 'puppeteer';
import { execFileSync } from 'child_process';
import { renameSync } from 'fs';
import cron from 'node-cron';
import 'dotenv/config';
import path from 'node:path';
import sharp from 'sharp';
const base = process.env.PWD;

const URL = process.env.URL;
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const CRON=process.env.CRON || "0 5,10,20,25,35,40,50,55 * * * *  ;  48 14,29,44,59 * * * *";
const WAIT_FOR_PAGE_MS = Number(process.env.WAIT_FOR_PAGE_MS || 5000);
const OUTPUT_DIR= path.join(base,process.env.OUTPUT_DIR) || "/output";
const VIEWPORT_WIDTH=Number(process.env.VIEWPORT_WIDTH || 1024);
const VIEWPORT_HEIGHT=Number(process.env.VIEWPORT_HEIGHT || 768);
const __dirname = path.resolve();

import express from 'express';
const app = express();
const port = 3000;

//Express server
//set view engine
app.set("view engine","ejs")
app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
  res.render("index",{ message: 'Hello, World!' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
app.use(express.static('output'))


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
  //await page.waitForTimeout(WAIT_FOR_PAGE_MS);

  const ss = await page.screenshot({path: "output/screenshot.tmp.jpg",type: "jpeg"});
  log("Screenshot taken.");

  await page.close();

  sharp('output/screenshot.tmp.jpg').grayscale().toFile('output/screenshot.jpg', (err, info) => {if(err) {log(err)} log(info) });
  log("Screenshot created.");


  //renameSync(OUTPUT_DIR + "/screenshot.tmp.jpg", OUTPUT_DIR + "/screenshot.
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

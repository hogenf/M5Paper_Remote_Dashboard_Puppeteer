// based on https://www.howtogeek.com/devops/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/

import { execFileSync } from 'child_process';
import { renameSync } from 'fs';
import cron from 'node-cron';
import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import morgan from 'morgan';
import logger from './logger.js';
import { initializeBrowser, fetchPage } from './puppeteerHelper.js';

const base = process.env.PWD;
const URL = process.env.URL;
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const CRON = process.env.CRON || "0 5,10,20,25,35,40,50,55 * * * *  ;  48 14,29,44,59 * * * *";
const WAIT_FOR_PAGE_MS = Number(process.env.WAIT_FOR_PAGE_MS || 5000);
const OUTPUT_DIR = path.join(base, process.env.OUTPUT_DIR) || "/output";
const VIEWPORT_WIDTH = Number(process.env.VIEWPORT_WIDTH || 1024);
const VIEWPORT_HEIGHT = Number(process.env.VIEWPORT_HEIGHT || 768);
const __dirname = path.resolve();

const app = express();
const port = 3000;

// Setup morgan to use winston for logging HTTP requests
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Express server
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
  res.render("index", { message: 'Hello, World!' });
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
app.use(express.static('output'));

if (!URL) {
  logger.error("Missing URL environment variable.");
  process.exit(1);
}

await initializeBrowser(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

async function fetch() {
  await fetchPage(URL, BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, WAIT_FOR_PAGE_MS, OUTPUT_DIR);
}

logger.info("Initial fetch...");
await fetch(); // on startup, execute fetch regardless of schedule

// install cron jobs
CRON.split(";").forEach(c => {
  c = c.trim();
  logger.info("Scheduling " + c);
  cron.schedule(c, async () => await fetch());
});

// the CRON job will never end unless container is terminated
//await browser.close();

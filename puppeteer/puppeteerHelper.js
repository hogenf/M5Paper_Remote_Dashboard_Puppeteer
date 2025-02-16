import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'node:path';
import logger from './logger.js';

const log = txt => {
  logger.info(txt);
};

let browser;

export async function initializeBrowser(viewportWidth, viewportHeight) {
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: viewportWidth, height: viewportHeight },
      args: ["--no-sandbox"]
    });
  } catch (error) {
    logger.error("Failed to launch browser:", error);
    process.exit(1);
  }
}

export async function fetchPage(url, basicAuthUsername, basicAuthPassword, waitForPageMs, outputDir) {
  log("Fetching " + url);

  let page;
  try {
    page = await browser.newPage();

    // set the HTTP Basic Authentication credential
    if (basicAuthUsername) {
      await page.authenticate({ 'username': basicAuthUsername, 'password': basicAuthPassword });
    }
    await page.goto(url);

    log("Waiting for " + waitForPageMs + "ms until page is rendered.");
    await page.waitForTimeout(waitForPageMs);

    const screenshotPath = path.join(outputDir, "screenshot.tmp.jpg");
    await page.screenshot({ path: screenshotPath, type: "jpeg" });
    log("Screenshot taken.");

    await page.close();

    sharp(screenshotPath).grayscale().toFile(path.join(outputDir, 'screenshot.jpg'), (err, info) => {
      if (err) {
        logger.error("Error processing screenshot:", err);
      } else {
        log("Screenshot processed:", info);
      }
    });
    log("Screenshot created.");
  } catch (error) {
    logger.error("Error during fetch:", error);
    if (page) {
      await page.close();
    }
  }

  log("---------------------------------------");
}
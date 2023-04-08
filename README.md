# M5Paper_Remote_Dashboard_Puppeteer

Docker container for periodically visiting a website using [Puppeteer][1] and creating a screenshot, converting it from PNG to JPG using [imagemagick][2].

While it can be used for any purpose, it was primarily set up to be used together with [`M5Paper_Remote_Dashboard`][3].

## docker-compose

Usage is easiest using `docker compose` and local bind-mounts.

```version: '2'
services:
  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./data/html:/usr/share/nginx/html
  puppeteer:
    image: docker-private.dont-panic.cc/home-dashboard-puppeteer
    network_mode: "host"
    mem_limit: 256M
    restart: always
    environment:
      - "TZ=Europe/Vienna"
      - "URL=https://example.com"
      - "VIEWPORT_WIDTH=540"
      - "VIEWPORT_HEIGHT=960"
      - "BASIC_AUTH_USERNAME=optional"
      - "BASIC_AUTH_PASSWORD=optional"
      - "WAIT_FOR_PAGE_MS=10000"
      - "CRON=0 5,10,20,25,35,40,50,55 * * * *  ;  48 14,29,44,59 * * * *"
    volumes:
      - ./data/html/puppeteer:/output
```

The only required environment variable is `URL`.

Since the container executes with uid 1000, gid 1000, you should pre-create `./data/html/puppeteer` via

```bash
mkdir -p ./data/html/puppeteer
chown 1000 ./data/html/puppeteer
```

After starting the stack with `docker-compose up -d`, once the screenshot has been created, access it via `http://<your-ip>:8080/puppeteer/screenshot.jpg`

## Cron
The `CRON` environment variable allows to specify one or more cron expressions as understood by [`node-cron`][4]. Multiple schedules need to be separated with a semicolon (`;`).

The above setting considers the specific timings of the [`M5Paper_Remote_Dashboard`][3] project:

* `0 5,10,20,25,35,40,50,55 * * * *`: at every full 5min interval that's not covered by the next rule, take a screenshot, because I want to be able to get "up-to-date" information when accessing the page using a web-browser manually
* `48 14,29,44,59 * * * *`: at every full 15-min interval, the M5Paper will wake up and request the JPG. It takes around 5 seconds to get to the stage where it executes the GET request in my setup. Taking the screenshot with the timings specified above takes 15 seconds. Starting at 48s of the previous minute will result in the screenshot to be taken 2 seconds before the M5Paper will request the image.

## Acknowledgements
* Dockerfile is based on "[How to Run Puppeteer and Headless Chrome in a Docker Container][5]" by James Walker.


[1]: https://pptr.dev/
[2]: https://imagemagick.org/
[3]: https://github.com/capi/M5Paper_Remote_Dashboard
[4]: https://www.npmjs.com/package/node-cron
[5]: https://www.howtogeek.com/devops/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/

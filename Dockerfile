# based on https://www.howtogeek.com/devops/how-to-run-puppeteer-and-headless-chrome-in-a-docker-container/

FROM node:lts

ARG USER_ID=1000
ARG GROUP_ID=1000
ARG APT_PROXY=

RUN if [ -n "$APT_PROXY" ]; then \
      echo "Acquire::http { Proxy \"$APT_PROXY\"; };" > /etc/apt/apt.conf.d/00-proxy; \
      echo "Acquire::Retries \"3\";" >> /etc/apt/apt.conf.d/00-proxy; \
    fi; \
    apt update && \
    apt-get install -y \
      fonts-liberation \
      gconf-service \
      libappindicator1 \
      libasound2 \
      libatk1.0-0 \
      libcairo2 \
      libcups2 \
      libfontconfig1 \
      libgbm-dev \
      libgdk-pixbuf2.0-0 \
      libgtk-3-0 \
      libicu-dev \
      libjpeg-dev \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libpng-dev \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \ 
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      xdg-utils \
      imagemagick && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*
 
RUN groupmod --gid $GROUP_ID node && usermod --uid $USER_ID node

#RUN mkdir /puppeteer && chown node:node /puppeteer


USER node
COPY --chown=node:node ./puppeteer /puppeteer
WORKDIR /puppeteer

RUN npm install

ENV URL https://example.com/
ENV BASIC_AUTH_USERNAME ""
ENV BASIC_AUTH_PASSWORD ""
ENV WAIT_FOR_PAGE_MS 5000
ENV DELAY_BETWEEN_SCREENSHOTS_MS 900000
ENV OUTPUT_DIR /output
ENV VIEWPORT_WIDTH 1024
ENV VIEWPORT_HEIGHT 768

VOLUME /output
CMD [ "node", "index.js" ]

const cheerio = require('cheerio');
const Browser = require('zombie');
const Fetch = require('zombie/lib/fetch');

const cheerioOptions = {
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
  decodeEntities: false
};

const getProductDetails = (url) => {
  const scraperConfigUtil = require('./config');
  const config = scraperConfigUtil.getConfig(url);
  const browser = new Browser();

  browser.silent = true;
  browser.waitDuration = '30s';

  let numResources = 0;
  browser.on('request', () => ++numResources);
  browser.on('response', () => --numResources);

  // Ignore certain resource requests.
  browser.pipeline.addHandler((browser, request) => {
    let doAbort = false;

    config.ignoreResources.forEach((domain) => {
      if (request.url.includes(domain)) {
        doAbort = true;
      }
    });

    if (doAbort) {
      return new Fetch.Response('', { status: 200 });
    }
  });

  return new Promise((resolve, reject) => {
    const onBrowserLoaded = () => {
      const content = browser.html();
      const $ = cheerio.load(content, cheerioOptions);
      const name = $(config.nameSelector).text().trim();

      let price = $(config.priceSelector)
        .text()
        .trim()
        .replace('$', '')
        .replace(/ /g, '');

      price = parseFloat(price);
      price = Math.round(price);

      if (isNaN(price)) {
        price = 0;
      }

      let thumbnailSrc = $(config.thumbnailSelector).first().attr('src') || '';
      thumbnailSrc = thumbnailSrc.trim();

      const productInfo = {
        name,
        price,
        thumbnailSrc,
        url
      };

      console.log('Product info:', productInfo);

      resolve(productInfo);
    };

    function onVisit() {
      browser.wait();

      const max = 20; // 10 seconds
      let counter = 0;

      const interval = setInterval(() => {
        const maximumChecksReached = (++counter > max);

        if (numResources === 0 || maximumChecksReached) {
          if (maximumChecksReached) {
            console.log('Maximum checks reached!');
          }

          clearInterval(interval);
          onBrowserLoaded();
        }
      }, 500);
    }

    browser.visit(url, {
      runScripts: true,
      loadCSS: false,
      silent: true
    }, onVisit);
  });
};

module.exports = {
  getProductDetails
};

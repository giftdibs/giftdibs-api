const cheerio = require('cheerio');
const Browser = require('zombie');
const Fetch = require('zombie/lib/fetch');

const scraperConfigUtil = require('./config');

const dateScrapedRecommended = new Date().getTime() - (24 * 3600); // 24 hours
let _activeScraper;

function ProductScraper(browser, browserConfig = {}) {
  this.url = undefined;
  this.productConfig = undefined;

  this.scrapeUrl = (url) => {
    this.productConfig = scraperConfigUtil.getConfig(url);
    this.url = url;

    return new Promise((resolve) => {
      browser.visit(url, () => {
        const details = onBrowserLoaded();
        resolve(details);
      });
    });
  };

  const onBrowserLoaded = () => {
    const content = browser.html();

    const cheerioConfig = {
      lowerCaseTags: false,
      lowerCaseAttributeNames: false,
      decodeEntities: false
    };

    const $ = cheerio.load(content, cheerioConfig);
    const name = $(this.productConfig.nameSelector).text().trim();

    let price = $(this.productConfig.priceSelector)
      .text()
      .trim()
      .replace('$', '')
      .replace(/ /g, '');

    price = parseFloat(price);
    price = Math.round(price);

    if (isNaN(price)) {
      price = 0;
    }

    let thumbnailSrc = $(this.productConfig.thumbnailSelector).first().attr('src') || '';
    thumbnailSrc = thumbnailSrc.trim();

    const productInfo = {
      name: name || 'No product name found',
      price,
      thumbnailSrc,
      url: this.url,
      dateScraped: new Date()
    };

    return productInfo;
  };
}

const createBrowser = () => {
  const browser = new Browser();
  browser.silent = true;
  browser.waitDuration = '30s';

  // Ignore certain resource requests.
  browser.pipeline.addHandler((browser, request) => {
    let doAbort = false;

    const ignoredResources = _activeScraper.productConfig.ignoredResources;
    // console.log('checking ignored resources?', ignoredResources);

    ignoredResources.forEach((domain) => {
      if (request.url.includes(domain)) {
        doAbort = true;
      }
    });

    if (doAbort) {
      return new Fetch.Response('', { status: 200 });
    }
    //  else {
    //   console.log('loading resource...\n', request.url);
    // }
  });

  return browser;
};

const getProductDetails = (urls, utilOptions = {}) => {
  const browser = createBrowser();

  return new Promise((resolve) => {
    let allProductDetails = [];
    let counter = 0;

    const init = (url) => {
      _activeScraper = new ProductScraper(browser);
      // console.log('\n\nget url:', url, '\n-------------------------------');

      _activeScraper
        .scrapeUrl(url)
        .then((details) => {
          allProductDetails.push(details);

          if (urls[++counter]) {
            process.nextTick(() => {
              init(urls[counter]);
            });
          } else {
            console.log('done scraping urls.');
            resolve(allProductDetails);
          }
        });
    };

    init(urls[counter]);
  });
};

module.exports = {
  dateScrapedRecommended,
  getProductDetails
};

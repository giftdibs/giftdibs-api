const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
// const urlScraper = require('../utils/url-scraper');
const { URLScraperError } = require('../shared/errors');

const scrapeProductPage = [
  (req, res, next) => {
    const isUrl = (/^https?:\/\//.test(req.query.url));

    if (isUrl) {
      const cp = require('child_process');
      const child = cp.fork('./scripts/scrape-url');

      child.on('message', (message) => {
        child.kill('SIGINT');
        authResponse({ products: message })(req, res, next);
      });

      console.log('sending to child...');
      process.nextTick(() => {
        child.send({ url: req.query.url });
      });
    } else {
      next(new URLScraperError());
    }
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/scrape-product-page')
  .get(scrapeProductPage);

module.exports = {
  middleware: {
    scrapeProductPage
  },
  router
};

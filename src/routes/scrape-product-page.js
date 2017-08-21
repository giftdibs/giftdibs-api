const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const urlScraper = require('../utils/url-scraper');

const scrapeProductPage = [
  (req, res, next) => {
    const isUrl = (/^https?:\/\//.test(req.query.url));

    if (isUrl) {
      return urlScraper
        .getPageContents(req.query.url)
        .then((product) => {
          authResponse({
            product
          })(req, res, next);
        })
        .catch(next);
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

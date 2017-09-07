const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const urlScraper = require('../utils/url-scraper');
const { URLScraperError } = require('../shared/errors');

const scrapeProductPage = [
  (req, res, next) => {
    const isUrl = (/^https?:\/\//.test(req.query.url));

    if (isUrl) {
      urlScraper
        .getProductDetails([
          req.query.url
        ])
        .then((products) => {
          authResponse({
            products
          })(req, res, next);
        })
        .catch(next);
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

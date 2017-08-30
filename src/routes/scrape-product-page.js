const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const urlScraper = require('../utils/url-scraper');

const scrapeProductPage = [
  (req, res, next) => {
    const isUrl = (/^https?:\/\//.test(req.query.url));

    if (isUrl) {
      urlScraper
        .getProductDetails([req.query.url])
        .then((products) => {
          authResponse({
            products
          })(req, res, next);
        })
        .catch(next);
    } else {
      const err = new Error('Please provide a valid URL.');
      err.status = 400;
      err.code = 500;
      next(err);
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

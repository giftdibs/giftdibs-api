const express = require('express');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const Gift = require('../database/models/gift');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { ExternalUrlNotFoundError } = require('../shared/errors');
const urlScraper = require('../utils/url-scraper');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 501;
    err.status = 400;
    err.message = 'External URL update validation failed.';
  }

  next(err);
}

const updateExternalUrl = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    let _wishList;

    Gift
      .getById(req.params.wishListId, req.params.giftId)
      .then((result) => {
        _wishList = result.wishList;

        const externalUrl = result.gift.externalUrls.id(req.params.externalUrlId);

        if (externalUrl) {
          return externalUrl;
        }

        return Promise.reject(new ExternalUrlNotFoundError());
      })
      .then((externalUrl) => {
        // First, update the external url document.
        externalUrl.update(req.body);

        // Check if the user wants to scrape the product url.
        if (req.query.scrapeUrl === undefined) {
          return externalUrl;
        }

        const isUrlCurrent = (
          externalUrl.dateScraped &&
          externalUrl.dateScraped.getTime() > urlScraper.dateScrapedRecommended
        );

        // If the url doesn't need to be scraped, short-circuit.
        if (isUrlCurrent) {
          return externalUrl;
        }

        // Scrape the url's contents and update.
        return urlScraper
          .getProductDetails([
            externalUrl.url
          ])
          .then((productInfoArray) => {
            const productInfo = productInfoArray[0];

            // Only update the external url if a price was found.
            if (productInfo.price) {
              externalUrl.price = productInfo.price;
              externalUrl.dateScraped = new Date();
            }

            return externalUrl;
          });
      })
      .then((externalUrl) => {
        return _wishList
          .save()
          .then(() => externalUrl);
      })
      .then((externalUrl) => {
        authResponse({
          externalUrl: externalUrl,
          message: 'External URL successfully updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/wish-lists/:wishListId/gifts/:giftId/external-urls/:externalUrlId')
  .patch(updateExternalUrl);

module.exports = {
  middleware: {
    updateExternalUrl
  },
  router
};

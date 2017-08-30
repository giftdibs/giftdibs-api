const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { GiftNotFoundError } = require('../shared/errors');
const urlScraper = require('../utils/url-scraper');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 301;
    err.status = 400;
    err.message = 'Wish list update validation failed.';
  }

  next(err);
}

const addGift = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    WishList
      .getById(req.params.wishListId)
      .then((wishList) => {
        wishList.gifts.push({
          budget: req.body.budget,
          externalUrls: req.body.externalUrls,
          name: req.body.name
        });

        return wishList.save();
      })
      .then((wishList) => {
        authResponse({
          giftId: wishList.gifts[wishList.gifts.length - 1]._id,
          message: 'Gift successfully added.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const deleteGift = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    WishList
      .getById(req.params.wishListId)
      .then((wishList) => {
        const gift = wishList.gifts.id(req.params.giftId);

        if (!gift) {
          return Promise.reject(new GiftNotFoundError());
        }

        gift.remove();

        return wishList.save();
      })
      .then((doc) => {
        authResponse({
          message: 'Gift successfully deleted.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const updateGift = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    WishList
      .getById(req.params.wishListId)
      .then((wishList) => {
        const gift = wishList.gifts.id(req.params.giftId);

        if (!gift) {
          return Promise.reject(new GiftNotFoundError());
        }

        // Handle any external URLs that need to be removed.
        gift.externalUrls.forEach((externalUrl) => {
          let found = false;

          req.body.externalUrls.forEach((formData) => {
            if (externalUrl._id.equals(formData._id)) {
              found = true;
            }
          });

          if (!found) {
            externalUrl.remove();
          }
        });

        // Update existing urls.
        req.body.externalUrls.forEach((formData) => {
          let externalUrlDoc = gift.externalUrls.id(formData._id);
          if (externalUrlDoc) {
            externalUrlDoc.update(formData);
          } else {
            gift.externalUrls.push(formData);
          }
        });

        gift.update(req.body);

        return wishList.save();
      })
      .then(() => {
        authResponse({
          message: 'Gift successfully updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const updateExternalUrl = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    let _wishList;

    WishList
      .getById(req.params.wishListId)
      .then((wishList) => {
        const gift = wishList.gifts.id(req.params.giftId);

        if (!gift) {
          return Promise.reject(new GiftNotFoundError());
        }

        _wishList = wishList;
        return gift;
      })
      .then((gift) => {
        const found = gift.externalUrls.filter((externalUrl) => {
          return (externalUrl._id.equals(req.params.externalUrlId));
        })[0];

        if (!found) {
          return Promise.reject(new Error('External URL not found!'));
        }

        return found;
      })
      .then((externalUrl) => {
        if (req.query.scrapeUrl !== undefined) {
          const isUrlCurrent = (externalUrl.dateScraped && externalUrl.dateScraped.getTime() > urlScraper.dateScrapedRecommended);

          if (isUrlCurrent) {
            return externalUrl;
          }

          return urlScraper
            .getProductDetails([externalUrl.url])
            .then((productInfoArray) => {
              const productInfo = productInfoArray[0];

              if (productInfo.price) {
                externalUrl.price = productInfo.price;
                externalUrl.dateScraped = new Date();
              }

              return _wishList
                .save()
                .then(() => externalUrl);
            });
        }
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
router.route('/wish-lists/:wishListId/gifts')
  .post(addGift)
router.route('/wish-lists/:wishListId/gifts/:giftId')
  .delete(deleteGift)
  .patch(updateGift);
router.route('/wish-lists/:wishListId/gifts/:giftId/external-urls/:externalUrlId')
  .patch(updateExternalUrl);

module.exports = {
  middleware: {
    addGift,
    deleteGift,
    updateGift
  },
  router
};

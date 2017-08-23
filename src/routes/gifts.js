const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { GiftNotFoundError } = require('../shared/errors');

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
          name: req.body.name,
          externalUrl: req.body.externalUrl,
          budget: req.body.budget
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

const router = express.Router();
router.use(authenticateJwt);
router.route('/wish-lists/:wishListId/gifts')
  .post(addGift)
router.route('/wish-lists/:wishListId/gifts/:giftId')
  .delete(deleteGift)
  .patch(updateGift);

module.exports = {
  middleware: {
    addGift,
    deleteGift,
    updateGift
  },
  router
};

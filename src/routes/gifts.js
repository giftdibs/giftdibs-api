const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { GiftValidationError } = require('../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new GiftValidationError();
    error.errors = err.errors;
    next(error);
    return;
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
      .getGiftById(req.params.wishListId, req.params.giftId)
      .then((result) => {
        result.gift.remove();
        return result.wishList.save();
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
      .getGiftById(req.params.wishListId, req.params.giftId)
      .then((result) => {
        const gift = result.gift;
        const wishList = result.wishList;

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

const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { GiftNotFoundError, WishListNotFoundError } = require('../shared/errors');

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
      .find({ _id: req.params.wishListId })
      .limit(1)
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }

        return wishList;
      })
      .then((wishList) => {
        wishList.gifts.push({
          name: req.body.name,
          externalUrl: req.body.externalUrl,
          budget: req.body.budget
        });

        return wishList.save();
      })
      .then((doc) => {
        authResponse({
          giftId: doc.gifts[doc.gifts.length - 1]._id,
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
      .find({ _id: req.params.wishListId })
      .limit(1)
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }

        return wishList;
      })
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
      .find({ _id: req.params.wishListId })
      .limit(1)
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }

        return wishList;
      })
      .then((wishList) => {
        const gift = wishList.gifts.id(req.params.giftId);

        if (!gift) {
          return Promise.reject(new GiftNotFoundError());
        }

        gift.update(req.body);

        return wishList.save();
      })
      .then((doc) => {
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
  },
  router
};

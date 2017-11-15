const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const { Gift } = require('../database/models/gift');
const { WishList } = require('../database/models/wish-list');
const {
  GiftValidationError,
  WishListNotFoundError
} = require('../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new GiftValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function sortByOrder(gifts) {
  gifts.sort((a, b) => {
    if (b.orderInWishList === undefined) {
      return -1;
    }

    if (a.orderInWishList === undefined) {
      return 1;
    }

    if (a.orderInWishList < b.orderInWishList) {
      return -1;
    }

    if (a.orderInWishList > b.orderInWishList) {
      return 1;
    }

    return 0;
  });
}

function getGifts(req, res, next) {
  const query = {};
  const wishListId = req.query.wishListId;

  let promise = Promise.resolve();

  // If wish list ID set, verify that the wish list exists.
  if (wishListId) {
    query._wishList = wishListId;
    promise = WishList
      .find({ _id: wishListId })
      .limit(1)
      .lean()
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }
      });
  }

  // Get all gifts based on revised query:
  promise
    .then(() => Gift.find(query).lean())
    .then((gifts) => {
      if (wishListId) {
        sortByOrder(gifts);
      }

      authResponse({
        gifts
      })(req, res, next);
    })
    .catch(next);
}

function addGift(req, res, next) {
  WishList
    .confirmUserOwnership(req.body._wishList, req.user._id)
    .then(() => {
      const gift = new Gift({
        _user: req.user._id,
        _wishList: req.body._wishList,
        budget: req.body.budget,
        externalUrls: req.body.externalUrls,
        name: req.body.name
      });

      return gift.save();
    })
    .then((gift) => {
      authResponse({
        giftId: gift._id,
        message: 'Gift successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function deleteGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then(() => Gift.remove({ _id: req.params.giftId }))
    .then(() => {
      // TODO: Remove any dibs associated with this gift.
      authResponse({
        message: 'Gift successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

function updateGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then((gift) => {
      return WishList
        .confirmUserOwnership(gift._wishList, req.user._id)
        .then(() => gift);
    })
    .then((gift) => {
      gift.updateSync(req.body);
      return gift.save();
    })
    .then(() => {
      authResponse({
        message: 'Gift successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

const router = express.Router();
router.use(authenticateJwt);
router.route('/gifts')
  .get(getGifts)
  .post(addGift)
router.route('/gifts/:giftId')
  .delete(deleteGift)
  .patch(updateGift);

module.exports = {
  middleware: {
    addGift,
    getGifts,
    deleteGift,
    updateGift
  },
  router
};

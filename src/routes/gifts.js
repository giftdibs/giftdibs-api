const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { Gift } = require('../database/models/gift');
const { confirmUserOwnsGift } = require('../middleware/confirm-user-owns-gift');
const { GiftValidationError } = require('../shared/errors');

const {
  confirmUserOwnsWishList
} = require('../middleware/confirm-user-owns-wish-list');

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

const getGifts = [
  (req, res, next) => {
    const query = {};
    const wishListId = req.query.wishListId;

    if (wishListId) {
      query._wishList = wishListId;
    }

    Gift
      .find(query)
      .lean()
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
];

const addGift = [
  confirmUserOwnsWishList,

  (req, res, next) => {
    const gift = new Gift({
      _user: req.user._id,
      _wishList: req.body._wishList,
      budget: req.body.budget,
      externalUrls: req.body.externalUrls,
      name: req.body.name
    });

    gift
      .save()
      .then((newGift) => {
        authResponse({
          giftId: newGift._id,
          message: 'Gift successfully created.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const deleteGift = [
  confirmUserOwnsGift,

  (req, res, next) => {
    Gift
      .remove({ _id: req.params.giftId })
      .then(() => {
        // TODO: Remove any dibs associated with this gift.
        authResponse({
          message: 'Gift successfully deleted.'
        })(req, res, next);
      })
      .catch(next);
  }
];

const updateGift = [
  confirmUserOwnsGift,
  confirmUserOwnsWishList,

  (req, res, next) => {
    Gift
      .find({
        _id: req.params.giftId
      })
      .limit(1)
      .then((docs) => {
        const gift = docs[0];
        gift.update(req.body);
        return gift.save();
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

const express = require('express');

const WishList = require('../database/models/wish-list');
const Dib = require('../database/models/dib');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { WishListNotFoundError } = require('../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 301;
    err.status = 400;
    err.message = 'Wish list update validation failed.';
  }

  next(err);
}

function sortGiftsByOrder(wishList) {
  wishList.gifts.sort((a, b) => {
    if (b.order === undefined) {
      return -1;
    }

    if (a.order === undefined) {
      return 1;
    }

    if (a.order < b.order) {
      return -1;
    }

    if (a.order > b.order) {
      return 1;
    }

    return 0;
  });
}

const createWishList = [
  (req, res, next) => {
    const wishList = new WishList({
      _user: req.user._id,
      name: req.body.name
    });

    wishList
      .save()
      .then((doc) => {
        authResponse({
          wishListId: doc._id,
          message: 'Wish list successfully created.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const getWishList = [
  (req, res, next) => {
    WishList
      .find({ _id: req.params.wishListId })
      .limit(1)
      .populate('_user', 'firstName lastName')
      .lean()
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }

        sortGiftsByOrder(wishList);

        return wishList;
      })
      .then((wishList) => {
        if (req.user._id.equals(wishList._user._id)) {
          return wishList;
        }

        // If the current user is not the owner of the gift,
        // attach a dib id, if it is dibbed.
        const giftIds = wishList.gifts.map((gift) => {
          return gift._id;
        });

        return Dib
          .find({})
          .where('_gift')
          .in(giftIds)
          .lean()
          .then((dibs) => {
            dibs.forEach((dib) => {
              wishList.gifts.forEach((gift) => {
                if (gift._id.toString() === dib._gift.toString()) {
                  gift.dib = dib;
                }
              });
            });

            return wishList;
          });
      })
      .then((wishList) => {
        authResponse({
          wishList
        })(req, res, next);
      })
      .catch(next);
  }
];

const getWishLists = [
  function getAll(req, res, next) {
    let query = {};

    if (req.query.userId) {
      query._user = req.query.userId;
    }

    WishList
      .find(query)
      .select('_user name')
      .populate('_user', 'firstName lastName')
      .lean()
      .then(wishLists => {
        authResponse({
          wishLists
        })(req, res, next);
      })
      .catch(next);
  }
];

const updateWishList = [
  confirmUserOwnsWishList,

  function updateWithFormData(req, res, next) {
    WishList
      .getById(req.params.wishListId)
      .then((wishList) => {
        wishList.update(req.body);
        return wishList.save();
      })
      .then(() => {
        authResponse({
          message: 'Wish list updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const deleteWishList = [
  confirmUserOwnsWishList,
  (req, res, next) => {
    WishList
      .remove({ _id: req.params.wishListId })
      .then(() => {
        authResponse({
          message: 'Wish list successfully deleted.'
        })(req, res, next);
      })
      .catch(next);
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/wish-lists')
  .get(getWishLists)
  .post(createWishList);
router.route('/wish-lists/:wishListId')
  .get(getWishList)
  .patch(updateWishList)
  .delete(deleteWishList);

module.exports = {
  middleware: {
    getWishList,
    getWishLists,
    updateWishList,
    deleteWishList,
    createWishList
  },
  router
};

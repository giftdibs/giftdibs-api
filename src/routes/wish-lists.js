const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { WishList } = require('../database/models/wish-list');

const {
  confirmUserOwnsWishList
} = require('../middleware/confirm-user-owns-wish-list');

const {
  WishListNotFoundError,
  WishListValidationError
} = require('../shared/errors');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new WishListValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
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

        return wishList;
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
    const query = {};

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
      .find({ _id: req.params.wishListId })
      .limit(1)
      .then((docs) => {
        const wishList = docs[0];
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
        // TODO: Remove gifts that reference this wish list.
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

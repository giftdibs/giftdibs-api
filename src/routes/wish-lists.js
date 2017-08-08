const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const confirmUserOwnership = require('../middleware/confirm-user-ownership');

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
          id: doc._id,
          message: 'Wish list successfully created.'
        })(req, res, next);
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 301;
          err.status = 400;
          err.message = 'Wish list validation failed.';
        }

        next(err);
      });
  }
];

const getWishList = [
  (req, res, next) => {
    WishList
      .find({ _id: req.params.wishListId })
      .limit(1)
      .lean()
      .then(docs => {
        const wishList = docs[0];

        if (!wishList) {
          const err = new Error('Wish list not found.');
          err.code = 300;
          err.status = 400;
          return Promise.reject(err);
        }

        authResponse(wishList)(req, res, next);
      })
      .catch(next);
  }
];

const getWishLists = [
  (req, res, next) => {
    WishList
      .find({})
      .populate('_user')
      .lean()
      .then(docs => authResponse(docs)(req, res, next))
      .catch(next);
  }
];

const updateWishList = [
  confirmUserOwnership,

  function updateWithFormData(req, res, next) {
    const updateFields = [
      'name'
    ];

    let changes = {};
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (req.body[field] === null) {
          req.body[field] = undefined;
        }

        changes[field] = req.body[field];
      }
    });

    Promise
      .resolve()
      .then(() => {
        return WishList
          .find({ _id: req.params.wishListId })
          .limit(1);
      })
      .then((docs) => {
        const wishList = docs[0];

        for (const key in changes) {
          wishList.set(key, changes[key]);
        }

        return wishList.save();
      })
      .then(() => {
        authResponse({ message: 'Wish list updated.' })(req, res, next);
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          err.code = 301;
          err.status = 400;
          err.message = 'Wish list update validation failed.';
        }

        next(err);
      });
  }
];

const deleteWishList = [
  confirmUserOwnership,
  (req, res, next) => {
    WishList
      .remove({ _id: req.params.wishListId })
      .then(() => res.json({ message: `Wish list successfully deleted.` }))
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
    deleteWishList
  },
  router
};

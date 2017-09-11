const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');
const { WishListNotFoundError } = require('../shared/errors');
const { dateScrapedRecommended } = require('../utils/url-scraper');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 301;
    err.status = 400;
    err.message = 'Wish list update validation failed.';
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
          id: doc._id,
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
          wishList,
          externalUrls: {
            dateScrapedRecommended
          }
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
      .populate('_user', 'firstName lastName')
      .lean()
      .then(wishLists => authResponse({ wishLists })(req, res, next))
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

        /*
        1. get new index
        2. get original index
        3. swap the two items
        */

        // let newIndex;
        // let newId;
        // req.body.gifts.forEach((gift, i) => {
        //   if (newId) {
        //     return;
        //   }

        //   if (wishList.gifts[i]._id.toString() !== gift._id) {
        //     newIndex = i;
        //     newId = gift._id.toString();
        //   }
        // });

        // let oldId;
        // let oldIndex;
        // wishList.gifts.forEach((gift, i) => {
        //   // Get id of gift being replaced.
        //   if (i === newIndex) {
        //     oldId = gift._id.toString();
        //   }

        //   // Get index of gift being moved.
        //   if (newId === gift._id.toString()) {
        //     oldIndex = i;
        //   }
        // });

        // console.log('new?', newId, newIndex);
        // console.log('old?', oldId, oldIndex);

        // // const reorderedGifts = req.body.gifts.filter((gift, i) => {
        // //   return (wishList.gifts[i]._id.toString() !== gift._id);
        // // });

        // // const swap = (theArray, indexA, indexB) => {
        // //   let temp = theArray[indexA];
        // //   theArray[indexA] = theArray[indexB];
        // //   theArray[indexB] = temp;
        // // };

        // // swap(wishList.gifts, newIndex, oldIndex);

        // // console.log('wishList.gifts?', wishList.gifts);

        // const set = {};
        // set['gifts.' + newId + '.$position'] = oldIndex;
        // set['gifts.' + oldId + '.$position'] = newIndex;

        // console.log('set?', set);

        // return new Promise((resolve) => {
        //   WishList.update(wishList._id, { '$set': set }, () => {
        //     wishList.save().then(resolve);
        //   });
        // });

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
    deleteWishList,
    createWishList
  },
  router
};

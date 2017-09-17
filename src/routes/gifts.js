const express = require('express');

const WishList = require('../database/models/wish-list');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsWishList } = require('../middleware/confirm-user-owns-wish-list');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 401;
    err.status = 400;
    err.message = 'Gift update validation failed.';
  }

  next(err);
}

function addUpdateOrRemoveExternalUrls(gift, formData) {
  if (!Array.isArray(gift.externalUrls) || !Array.isArray(formData.externalUrls)) {
    return;
  }

  // Handle any external URLs that need to be removed.
  gift.externalUrls.forEach((externalUrl) => {
    const found = formData.externalUrls.filter((data) => {
      return (externalUrl._id.toString() === data._id);
    })[0];

    if (!found) {
      externalUrl.remove();
    }
  });

  formData.externalUrls.forEach((data) => {
    // Add a new external url if no _id provided.
    if (!data._id) {
      gift.externalUrls.push(data);
      return;
    }

    // Update existing external urls.
    const externalUrl = gift.externalUrls.id(data._id);
    if (externalUrl) {
      externalUrl.update(data);
    }
  });
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

        // addUpdateOrRemoveExternalUrls(gift, req.body);

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

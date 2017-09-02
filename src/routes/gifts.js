const express = require('express');

const WishList = require('../database/models/wish-list');
const Gift = require('../database/models/gift');
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

// function getGiftById(wishListId, giftId) {
//   return WishList
//     .getById(wishListId)
//     .then((wishList) => {
//       const gift = wishList.gifts.id(giftId);

//       if (!gift) {
//         return Promise.reject(new GiftNotFoundError());
//       }

//       return {
//         gift, wishList
//       };
//     });
// }

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

  // Update existing urls.
  formData.externalUrls.forEach((data) => {
    let externalUrl = gift.externalUrls.id(data._id);
    if (externalUrl) {
      externalUrl.update(data);
    } else {
      gift.externalUrls.push(data);
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
    Gift
      .getById(req.params.wishListId, req.params.giftId)
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
    Gift
      .getById(req.params.wishListId, req.params.giftId)
      .then((result) => {
        const gift = result.gift;
        const wishList = result.wishList;

        addUpdateOrRemoveExternalUrls(gift, req.body);

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

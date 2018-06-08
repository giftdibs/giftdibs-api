const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  GiftValidationError
} = require('../../shared/errors');

const {
  handleError
} = require('./shared');

function createGift(req, res, next) {
  const wishListId = req.body.wishListId;

  if (!wishListId) {
    throw new GiftValidationError(
      'Please provide a wish list ID.'
    );
  }

  let wishList;

  WishList
    .confirmUserOwnership(wishListId, req.user._id)
    .then((_wishList) => {
      wishList = _wishList;

      const gift = new Gift({
        name: req.body.name
      });

      return gift.save();
    })
    .then((giftDoc) => {
      wishList.addGiftSync(giftDoc);

      return wishList.save().then(() => giftDoc);
    })
    .then((gift) => {
      authResponse({
        data: { giftId: gift._id },
        message: 'Gift successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createGift
};

const authResponse = require('../../middleware/auth-response');

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

  WishList.confirmUserOwnership(wishListId, req.user._id)
    .then((wishList) => {
      const gift = wishList.gifts.create({
        name: req.body.name
      });

      wishList.gifts.push(gift);

      return wishList.save().then(() => gift);
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

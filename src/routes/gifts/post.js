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

  WishList
    .confirmUserOwnership(wishListId, req.user._id)
    .then((wishList) => {
      const gift = new Gift({
        budget: req.body.budget,
        name: req.body.name
      });

      return gift.save()
        .then((giftDoc) => {
          // TODO: Be sure to validate that gift IDs are unique!
          wishList._gifts.push(giftDoc._id);
          return wishList.save()
            .then(() => {
              return giftDoc;
            });
        })
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

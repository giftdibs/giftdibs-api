const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError
} = require('./shared');

function updateGift(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;
  const wishListId = req.body.wishListId;

  let wishList;

  WishList.confirmUserOwnershipByGiftId(giftId, userId)
    .then((_wishList) => {
      wishList = _wishList;
      const gift = wishList.gifts.id(giftId);

      if (wishListId) {
        return gift.moveToWishList(wishListId, req.user._id);
      }

      return { gift };
    })
    .then((result) => {
      result.gift.updateSync(req.body);
      return wishList.save().then(() => result);
    })
    .then((result) => {
      const data = {
        giftId: result.gift._id
      };

      data.wishListIds = result.wishListIds;

      authResponse({
        data,
        message: 'Gift successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateGift
};

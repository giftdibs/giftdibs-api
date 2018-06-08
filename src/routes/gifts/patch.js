const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  handleError
} = require('./shared');

function updateGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then((gift) => {
      const wishListId = req.body.wishListId;

      if (wishListId) {
        return gift.moveToWishList(wishListId, req.user._id);
      }

      return { gift };
    })
    .then((result) => {
      result.gift.updateSync(req.body);
      result.gift.save();
      return result;
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

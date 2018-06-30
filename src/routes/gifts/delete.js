const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError
} = require('./shared');

function deleteGift(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  WishList.confirmUserOwnershipByGiftId(giftId, userId)
    .then((wishList) => {
      wishList.gifts.id(giftId).remove();
      return wishList.save();
    })
    .then(() => {
      authResponse({
        data: { },
        message: 'Gift successfully deleted.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  deleteGift
};

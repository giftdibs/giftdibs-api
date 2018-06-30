const authResponse = require('../../middleware/auth-response');

const {
  formatGiftResponse
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError
} = require('./shared');

function getGift(req, res, next) {
  const giftId = req.params.giftId.toString();
  const userId = req.user._id.toString();

  WishList.findAuthorizedByGiftId(giftId, userId)
    .then((wishList) => {
      const gift = wishList.gifts.find((gift) => {
        return (gift._id.toString() === giftId);
      });

      return formatGiftResponse(gift, wishList, userId);
    })
    .then((gift) => {
      authResponse({
        data: { gift }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  getGift
};

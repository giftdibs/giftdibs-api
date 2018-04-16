const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');
const { WishList } = require('../../database/models/wish-list');
const { handleError } = require('./shared');

function updateGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then((gift) => {
      return WishList
        .confirmUserOwnership(gift._wishList, req.user._id)
        .then(() => gift);
    })
    .then((gift) => {
      gift.updateSync(req.body);
      return gift.save();
    })
    .then((gift) => {
      authResponse({
        message: 'Gift successfully updated.',
        data: { gift }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateGift
};

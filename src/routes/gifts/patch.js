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
  const attributes = req.body;

  WishList.updateGiftById(giftId, userId, attributes)
    .then(() => {
      authResponse({
        data: {},
        message: 'Gift successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function markGiftAsReceived(req, res, next) {
  const giftId = req.params.giftId;
  const user = req.user;

  WishList.markGiftAsReceived(giftId, user)
    .then(() => {
      authResponse({
        data: {},
        message: 'Gift successfully marked as received.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  markGiftAsReceived,
  updateGift
};

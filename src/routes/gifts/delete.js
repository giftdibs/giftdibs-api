const authResponse = require('../../middleware/auth-response');
const { Gift } = require('../../database/models/gift');

function deleteGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then((gift) => gift.remove())
    .then(() => {
      authResponse({
        message: 'Gift successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteGift
};

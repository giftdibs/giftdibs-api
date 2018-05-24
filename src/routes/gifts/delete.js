const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  handleError
} = require('./shared');

function deleteGift(req, res, next) {
  Gift
    .confirmUserOwnership(req.params.giftId, req.user._id)
    .then((gift) => gift.remove())
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

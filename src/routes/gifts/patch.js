const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');

const {
  handleError
} = require('./shared');

function updateGift(req, res, next) {
  Gift
    .findAuthorizedById(req.params.giftId, req.user._id)
    .then((gift) => {
      gift.updateSync(req.body);
      return gift.save();
    })
    .then(() => {
      authResponse({
        data: { },
        message: 'Gift successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateGift
};

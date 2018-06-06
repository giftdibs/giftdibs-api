const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  handleError
} = require('./shared');

function getGift(req, res, next) {
  Gift
    .findAuthorizedById(req.params.giftId, req.user._id)
    .then((gift) => {
      authResponse({
        data: { gift }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function getGifts(req, res, next) {
  authResponse({
    data: { gifts: [] }
  })(req, res, next);
}

module.exports = {
  getGift,
  getGifts
};

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function createDib(req, res, next) {
  const userId = req.user._id;
  const giftId = req.params.giftId;
  const attributes = req.body;

  WishList.createDib(giftId, attributes, userId)
    .then((dibId) => {
      authResponse({
        data: { dibId },
        message: 'Gift successfully dibbed!'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createDib
};

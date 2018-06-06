const {
  WishList
} = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function updateWishList(req, res, next) {
  const sanitized = WishList.sanitizeRequest(req.body);
  req.body = sanitized;

  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then((wishList) => {
      wishList.updateSync(req.body);
      return wishList.save();
    })
    .then(() => {
      authResponse({
        data: {},
        message: 'Wish list updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateWishList
};

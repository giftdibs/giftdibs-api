const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError,
  sanitizeRequestBody
} = require('./shared');

function updateWishList(req, res, next) {
  const wishListId = req.params.wishListId;
  const userId = req.user._id;
  const attributes = sanitizeRequestBody(req.body);

  WishList
    .confirmUserOwnership(wishListId, userId)
    .then((wishList) => {
      wishList.updateSync(attributes);
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

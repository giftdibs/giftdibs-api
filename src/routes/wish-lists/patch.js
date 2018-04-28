const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function updateWishList(req, res, next) {
  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then((wishList) => {
      wishList.updateSync(req.body.attributes);
      return wishList.save();
    })
    .then((wishList) => {
      authResponse({
        message: 'Wish list updated.',
        data: { wishList }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateWishList
};

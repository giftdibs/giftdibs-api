const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

function deleteWishList(req, res, next) {
  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then(() => {
      return WishList
        .remove({
          _id: req.params.wishListId
        });
    })
    .then(() => {
      // TODO: Remove gifts that reference this wish list.
      authResponse({
        message: 'Wish list successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteWishList
};

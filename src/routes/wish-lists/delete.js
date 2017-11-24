const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

function deleteWishList(req, res, next) {
  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then((wishList) => wishList.remove())
    .then(() => {
      authResponse({
        message: 'Wish list successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteWishList
};

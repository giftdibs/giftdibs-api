const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

function deleteWishList(req, res, next) {
  const wishListId = req.params.wishListId;
  const userId = req.user._id;

  WishList
    .confirmUserOwnership(wishListId, userId)
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

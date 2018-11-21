const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

async function deleteWishList(req, res, next) {
  const wishListId = req.params.wishListId;
  const userId = req.user._id;

  try {
    const wishList = await WishList.confirmUserOwnership(
      wishListId,
      userId
    );

    await wishList.remove();

    authResponse({
      message: 'Wish list successfully deleted.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteWishList
};

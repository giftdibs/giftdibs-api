const authResponse = require('../../middleware/auth-response');

const { WishList } = require('../../database/models/wish-list');

const { handleError, sanitizeRequestBody } = require('./shared');

async function updateWishList(req, res, next) {
  const wishListId = req.params.wishListId;
  const userId = req.user._id;
  const attributes = sanitizeRequestBody(req.body);

  try {
    const wishList = await WishList.confirmUserOwnership(wishListId, userId);

    wishList.updateSync(attributes);

    await wishList.save();

    authResponse({
      data: {},
      message: 'Wish list updated.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  updateWishList,
};

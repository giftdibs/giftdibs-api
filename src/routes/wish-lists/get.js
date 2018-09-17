const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  formatWishListResponse
} = require('./shared');

function getWishList(req, res, next) {
  const userId = req.user._id;

  WishList.findAuthorizedById(req.params.wishListId, userId)
    .then((wishList) => formatWishListResponse(wishList, userId))
    .then((wishList) => {
      authResponse({
        data: { wishList }
      })(req, res, next);
    })
    .catch(next);
}

function getWishLists(req, res, next) {
  const userId = req.user._id;
  const query = {};

  if (req.params.userId) {
    query._user = req.params.userId;
  }

  WishList.findAuthorized(userId, query)
    .then((wishLists) => {
      return wishLists.map((wishList) => {
        return formatWishListResponse(wishList, userId);
      });
    })
    .then((wishLists) => {
      authResponse({
        data: { wishLists }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getWishList,
  getWishLists
};

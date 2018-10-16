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

      wishLists.sort((a, b) => {
        const keyA = a.dateUpdated || a.dateCreated;
        const keyB = b.dateUpdated || b.dateCreated;
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
      });

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

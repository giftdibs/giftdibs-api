const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  formatWishListResponse
} = require('./shared');

function sortByDateUpdated(a, b) {
  const keyA = a.dateUpdated || a.dateCreated;
  const keyB = b.dateUpdated || b.dateCreated;
  if (keyA > keyB) return -1;
  if (keyA < keyB) return 1;
  return 0;
}

function sortByDateReceived(a, b) {
  const keyA = a.dateReceived;
  const keyB = b.dateReceived;

  if (!keyA) {
    return -1;
  }

  if (!keyB) {
    return 1;
  }

  if (keyA > keyB) return 1;
  if (keyA < keyB) return -1;

  return 0;
}

function getWishList(req, res, next) {
  const userId = req.user._id;

  WishList.findAuthorizedById(req.params.wishListId, userId)
    .then((wishList) => formatWishListResponse(wishList, userId))
    .then((wishList) => {
      wishList.gifts.sort(sortByDateUpdated);
      wishList.gifts.sort(sortByDateReceived);

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
      wishLists.sort(sortByDateUpdated);

      wishLists.forEach((wishList) => {
        wishList.gifts.sort(sortByDateUpdated);
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

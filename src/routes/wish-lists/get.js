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

function sortByPriority(a, b) {
  const keyA = a.priority;
  const keyB = b.priority;
  if (keyA > keyB) return -1;
  if (keyA < keyB) return 1;
  return 0;
}

function getWishList(req, res, next) {
  const userId = req.user._id;
  const wishListId = req.params.wishListId;
  const sortBy = req.query.sortBy;

  WishList.findAuthorizedById(wishListId, userId)
    .then((wishList) => formatWishListResponse(wishList, userId))
    .then((wishList) => {
      switch (sortBy) {
        case 'priority':
          wishList.gifts.sort(sortByPriority);
          break;
        default:
          wishList.gifts.sort(sortByDateUpdated);
          break;
      }

      authResponse({
        data: { wishList }
      })(req, res, next);
    })
    .catch(next);
}

function getWishLists(req, res, next) {
  const userId = req.user._id;
  const getArchived = (req.query.archived === true);

  let query;
  if (getArchived) {
    query = {
      isArchived: true
    };
  } else {
    query = {
      $or: [{
        isArchived: { $exists: false }
      }, {
        isArchived: false
      }]
    };
  }

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

function getArchivedWishLists(req, res, next) {
  req.query.archived = true;
  getWishLists(req, res, next);
}

module.exports = {
  getArchivedWishLists,
  getWishList,
  getWishLists
};

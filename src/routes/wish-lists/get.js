const authResponse = require('../../middleware/auth-response');

const { WishList } = require('../../database/models/wish-list');

const {
  WishListNotFoundError,
  WishListPermissionError
} = require('../../shared/errors');

function isUserAuthorizedToViewWishList(userId, wishList) {
  const isOwner = (wishList._user._id.toString() === userId.toString());
  const privacy = wishList.privacy;
  const privacyType = privacy && privacy.type;

  // Owners of a wish list should always be authorized.
  if (isOwner) {
    return true;
  }

  let passes = false;
  switch (privacyType) {
    case 'me':
      passes = false;
      break;

    default:
    case 'everyone':
      passes = true;
      break;

    case 'custom':
      passes = !!wishList.privacy._allow.find((allowId) => {
        return (allowId.toString() === userId.toString());
      });
      break;
  }

  return passes;
}

function formatWishListResponse(wishList) {
  wishList.user = wishList._user;
  delete wishList._user;

  const privacy = wishList.privacy || {};
  wishList.privacy = Object.assign({
    type: 'everyone',
    _allow: []
  }, privacy);

  return wishList;
}

function getWishList(req, res, next) {
  WishList
    .find({ _id: req.params.wishListId })
    .limit(1)
    .populate('_user', 'firstName lastName')
    .lean()
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      return wishList
    })
    .then((wishList) => {
      const isAuthorized = isUserAuthorizedToViewWishList(
        req.user._id,
        wishList
      );

      if (!isAuthorized) {
        return Promise.reject(
          new WishListPermissionError('You are not authorized to view that wish list.')
        );
      }

      return wishList;
    })
    .then((wishList) => formatWishListResponse(wishList))
    .then((wishList) => {
      authResponse({
        data: { wishList }
      })(req, res, next);
    })
    .catch(next);
}

function getWishLists(req, res, next) {
  const query = {};

  if (req.query.userId) {
    query._user = req.query.userId;
  }

  WishList
    .find(query)
    .populate('_user', 'firstName lastName')
    .lean()
    .then((wishLists) => {
      return wishLists.filter((wishList) => {
        return isUserAuthorizedToViewWishList(
          req.user._id,
          wishList
        );
      });
    })
    .then((wishLists) => {
      authResponse({
        data: {
          wishLists: wishLists.map(formatWishListResponse)
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getWishList,
  getWishLists
};

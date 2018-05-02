const authResponse = require('../../middleware/auth-response');

const { WishList } = require('../../database/models/wish-list');
const { Friendship } = require('../../database/models/friendship');

const {
  WishListNotFoundError,
  WishListPermissionError
} = require('../../shared/errors');

function isUserAuthorizedToViewWishList(userId, wishList, friendships) {
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
      if (!isOwner) {
        passes = false;
      }
      break;

    default:
    case 'everyone':
      passes = true;
      break;

    case 'friends':
      passes = !!friendships
        .filter((friendship) => {
          // Get only friendships that belong to this wish list owner.
          return (
            friendship._user._id.toString() === wishList._user._id.toString() ||
            friendship._friend._id.toString() === wishList._user._id.toString()
          );
        })
        .find((friendship) => {
          // Make sure the session user is a friend of wish list owner.
          return (
            friendship._user._id.toString() === userId.toString() ||
            friendship._friend._id.toString() === userId.toString()
          );
        });
      break;

    case 'custom':
      passes = (wishList.privacy._allow.indexOf(userId) > -1);
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
    .populate('privacy._allow', 'firstName lastName')
    .lean()
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      return Friendship.getFriendshipsByUserId(wishList._user._id)
        .then((friendships) => {
          return { friendships, wishList };
        });
    })
    .then((data) => {
      const isAuthorized = isUserAuthorizedToViewWishList(
        req.user._id,
        data.wishList,
        data.friendships
      );

      if (!isAuthorized) {
        return new WishListPermissionError('This wish list is private.');
      }

      return data.wishList;
    })
    .then((wishList) => {
      return formatWishListResponse(wishList);
    })
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
      return Friendship.getFriendshipsByUserId(req.user._id)
        .then((friendships) => {
          return { friendships, wishLists };
        });
    })
    .then((data) => {
      return data.wishLists.filter((wishList) => {
        return isUserAuthorizedToViewWishList(
          req.user._id,
          wishList,
          data.friendships
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

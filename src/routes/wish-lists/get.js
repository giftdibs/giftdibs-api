const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

function formatWishListResponse(wishList) {
  wishList.user = wishList._user;
  delete wishList._user;

  wishList.gifts = wishList._gifts;
  delete wishList._gifts;

  const privacy = wishList.privacy || {};
  wishList.privacy = Object.assign({
    type: 'everyone',
    _allow: []
  }, privacy);

  return wishList;
}

function getWishList(req, res, next) {
  WishList
    .findAuthorizedById(req.params.wishListId, req.user._id)
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
    .findAuthorized(req.user._id, query)
    .then((wishLists) => wishLists.map(formatWishListResponse))
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

const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

function getWishList(req, res, next) {
  WishList
    .findAuthorizedById(req.params.wishListId, req.user._id)
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

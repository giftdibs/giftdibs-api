const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  WishListNotFoundError
} = require('../../shared/errors');

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

      wishList.user = wishList._user;
      delete wishList._user;

      return wishList;
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
      authResponse({
        data: {
          wishLists: wishLists.map((wishList) => {
            wishList.user = wishList._user;
            delete wishList._user;
            return wishList;
          })
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getWishList,
  getWishLists
};

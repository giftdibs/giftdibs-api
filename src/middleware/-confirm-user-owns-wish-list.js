const { WishList } = require('../database/models/wish-list');

const {
  WishListNotFoundError,
  WishListPermissionError
} = require('../shared/errors');

function confirmUserOwnsWishList(req, res, next) {
  const wishListId = req.params.wishListId || req.body._wishList;

  if (wishListId === undefined) {
    next(new WishListNotFoundError());
    return;
  }

  WishList
    .find({ _id: wishListId })
    .limit(1)
    .lean()
    .then((docs) => {
      const doc = docs[0];

      if (!doc) {
        return Promise.reject(new WishListNotFoundError());
      }

      if (req.user._id.toString() === doc._user.toString()) {
        next();
        return;
      }

      return Promise.reject(new WishListPermissionError());
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsWishList
};

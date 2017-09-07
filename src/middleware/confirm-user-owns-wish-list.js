const WishList = require('../database/models/wish-list');
const { WishListNotFoundError } = require('../shared/errors');

function confirmUserOwnsWishList(req, res, next) {
  WishList
    .find({ _id: req.params.wishListId })
    .limit(1)
    .lean()
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      if (req.user._id.equals(wishList._user)) {
        next();
        return;
      }

      const err = new Error('Forbidden.');
      err.status = 403;
      err.code = 103;
      return Promise.reject(err);
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsWishList
};

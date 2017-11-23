const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');
const { WishList } = require('../../database/models/wish-list');

const {
  WishListNotFoundError
} = require('../../shared/errors');

function sortByOrder(gifts) {
  gifts.sort((a, b) => {
    if (b.orderInWishList === undefined) {
      return -1;
    }

    if (a.orderInWishList === undefined) {
      return 1;
    }

    if (a.orderInWishList < b.orderInWishList) {
      return -1;
    }

    if (a.orderInWishList > b.orderInWishList) {
      return 1;
    }

    return 0;
  });
}

function getGifts(req, res, next) {
  const query = {};
  const wishListId = req.query.wishListId;

  let promise = Promise.resolve();

  // If wish list ID set, verify that the wish list exists.
  if (wishListId) {
    query._wishList = wishListId;
    promise = WishList
      .find({ _id: wishListId })
      .limit(1)
      .lean()
      .then((docs) => {
        const wishList = docs[0];

        if (!wishList) {
          return Promise.reject(new WishListNotFoundError());
        }
      });
  }

  // Get all gifts based on revised query:
  promise
    .then(() => Gift.find(query).lean())
    .then((gifts) => {
      if (wishListId) {
        sortByOrder(gifts);
      }

      authResponse({
        gifts
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getGifts
};

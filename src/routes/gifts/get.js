const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError
} = require('./shared');

// function sortByOrder(gifts) {
//   gifts.sort((a, b) => {
//     if (b.orderInWishList === undefined) {
//       return -1;
//     }

//     if (a.orderInWishList === undefined) {
//       return 1;
//     }

//     if (a.orderInWishList < b.orderInWishList) {
//       return -1;
//     }

//     if (a.orderInWishList > b.orderInWishList) {
//       return 1;
//     }

//     return 0;
//   });
// }

function getGift(req, res, next) {
  WishList
    .findAuthorizedByGiftId(req.params.giftId, req.user._id)
    .then((wishList) => {
      return Gift
        .find({
          _id: req.params.giftId
        })
        .limit(1)
        .populate('dibs._user', 'firstName lastName')
        .lean()
        .then((docs) => {
          const gift = docs[0];
          gift.wishListId = wishList._id;
          gift.user = wishList._user;

          // TODO: Create a separate method that the wish list
          // routes can use too!
          // Remove dibs if session user is owner of gift.
          if (wishList._user._id.toString() === req.user._id.toString()) {
            gift.dibs = [];
          }

          if (gift.dibs) {
            gift.dibs = gift.dibs.map((dib) => {
              dib.user = dib._user;
              delete dib._user;
              return dib;
            });
          }

          return gift;
        });
    })
    .then((gift) => {
      authResponse({
        data: { gift }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function getGifts(req, res, next) {
  // const query = {};
  // const wishListId = req.query.wishListId;

  // let promise = Promise.resolve();

  // // If wish list ID set, verify that the wish list exists.
  // if (wishListId) {
  //   promise = WishList.getDocumentById(wishListId);
  // }

  // // Get all gifts based on revised query:
  // promise
  //   .then(() => Gift.find(query).lean())
  //   .then((gifts) => {
  //     if (wishListId) {
  //       sortByOrder(gifts);
  //     }

  //     authResponse({
  //       data: { gifts }
  //     })(req, res, next);
  //   })
  //   .catch(next);
}

module.exports = {
  getGift,
  getGifts
};

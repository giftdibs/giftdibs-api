const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

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
  Gift
    .findAuthorizedById(req.params.giftId, req.user._id)
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

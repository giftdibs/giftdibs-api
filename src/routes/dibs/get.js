const authResponse = require('../../middleware/auth-response');

// const {
//   DibValidationError
// } = require('../../shared/errors');

// const { WishList } = require('../../database/models/wish-list');
// const { Dib } = require('../../database/models/dib');

// function formatResponse(dibs) {
//   return dibs.map((dib) => {
//     dib.user = dib._user;
//     delete dib._user;
//     return dib;
//   });
// }

function getDibs(req, res, next) {
  authResponse({ data: { dibs: [] } })(req, res, next);
  // let promise;

// if (req.query.giftId) {
//   promise = WishList.findAuthorizedByGiftId(req.query.giftId, req.user._id);
// } else if (req.query.wishListId) {
//   promise = WishList.findAuthorizedById(req.query.wishListId, req.user._id);
// } else {
//   next(
//   new DibValidationError('Please provide either a gift ID or wish list ID.')
//   );
//   return;
// }

  // promise
  //   .then((wishList) => {
  //     // If the user owns the wish list, do not retrieve any dib information!
  //     if (wishList._user._id.toString() === req.user._id.toString()) {
  //       return [];
  //     }

  //     const giftIds = wishList._gifts.map((gift) => gift._id);

  //     return Dib
  //       .find({
  //         _gift: giftIds
  //       })
  //       .populate('_user', 'firstName lastName')
  //       .lean();
  //   })
  //   .then((dibs) => formatResponse(dibs))
  //   .then((dibs) => {
  //     authResponse({
  //       data: { dibs }
  //     })(req, res, next);
  //   })
  //   .catch(next);

  // // User wishes to retrieve all dibs for a given wish list.
  // // (If the user owns the wish list, do not retrieve any dib information!)
  // WishList
  //   .findAuthorizedById(req.query.wishListId, req.user._id)
  //   .then((wishList) => {
  //     if (wishList._user._id.toString() === req.user._id.toString()) {
  //       return [];
  //     }

  //     const giftIds = wishList._gifts.map((gift) => gift._id);

  //     return Dib
  //       .find({
  //         _gift: giftIds
  //       })
  //       .populate('_user', 'firstName lastName')
  //       .lean();
  //   })
  //   .then((dibs) => formatResponse(dibs))
  //   .then((dibs) => {
  //     authResponse({
  //       data: { dibs }
  //     })(req, res, next);
  //   })
  //   .catch(next);

  // Gift
  //   .find({
  //     _wishList: req.query.wishListId,
  //     _user: { $ne: req.user._id }
  //   })
  //   .lean()
  //   .then((gifts) => {
  //     const giftIds = gifts.map((gift) => gift._id);

  //     return Dib
  //       .find({})
  //       .where('_gift')
  //       .in(giftIds)
  //       .populate('_user', 'firstName lastName')
  //       .lean();
  //   })
  //   .then((dibs) => {
  //     authResponse({
  //       data: { dibs }
  //     })(req, res, next);
  //   })
  //   .catch(next);
}

module.exports = {
  getDibs
};

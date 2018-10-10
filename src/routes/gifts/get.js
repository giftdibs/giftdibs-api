const authResponse = require('../../middleware/auth-response');

const {
  formatGiftResponse
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  handleError
} = require('./shared');

function getGift(req, res, next) {
  const giftId = req.params.giftId.toString();
  const userId = req.user._id.toString();

  // TODO: Move this to a first-class method in the wish list schema.
  WishList.findAuthorizedByGiftId(giftId, userId)
    .then((wishList) => {
      const gift = wishList.gifts.find((gift) => {
        return (gift._id.toString() === giftId);
      });

      return formatGiftResponse(gift, wishList, userId);
    })
    .then((gift) => {
      authResponse({
        data: { gift }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function getGifts(req, res, next) {
  const userId = req.user._id.toString();
  // const startId = req.query.startId;
  // const query = {};

  // Paginate results?
  // https://stackoverflow.com/a/38265198/6178885
  // if (startId) {
  // query['gifts._id'] = {
  //   $gt: startId
  // };
  // }

  WishList.findAuthorized(userId)
    .then((wishLists) => {
      let gifts = [];

      wishLists.forEach((wishList) => {
        const formatted = wishList.gifts.map((gift) => {
          return formatGiftResponse(gift, wishList, userId);
        });

        gifts = gifts.concat(formatted);
      });

      authResponse({
        data: { gifts }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getGift,
  getGifts
};

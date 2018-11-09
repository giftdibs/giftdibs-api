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
  const start = parseInt(req.query.startIndex) || 0;
  const max = 12;

  WishList.findAuthorizedByFriendships(userId)
    .then((wishLists) => {
      let gifts = [];

      wishLists.forEach((wishList) => {
        wishList.gifts.forEach((gift) => {
          if (gift.dateReceived) {
            return;
          }

          gifts.push(
            formatGiftResponse(gift, wishList, userId)
          );
        });
      });

      gifts.sort((a, b) => {
        const keyA = a.dateUpdated || a.dateCreated;
        const keyB = b.dateUpdated || b.dateCreated;
        if (keyA > keyB) return -1;
        if (keyA < keyB) return 1;
        return 0;
      });

      gifts = gifts.slice(start, start + max);

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

const authResponse = require('../../middleware/auth-response');

const {
  GiftNotFoundError,
  DibValidationError
} = require('../../shared/errors');

const {
  handleError,
  validateDibQuantity
} = require('./shared');

const {
  Gift
} = require('../../database/models/gift');

const {
  WishList
} = require('../../database/models/wish-list');

function getDibbableGift(giftId, userId) {
  return Promise.all([
    WishList.findAuthorizedByGiftId(giftId, userId),
    Gift.find({ _id: giftId }).limit(1)
  ]).then((result) => {
    const wishList = result[0];
    const gift = result[1][0];

    if (!wishList) {
      throw new GiftNotFoundError();
    }

    if (wishList.user._id.toString() === userId.toString()) {
      throw new DibValidationError('You cannot dib your own gift.');
    }

    if (gift.isReceived) {
      throw new DibValidationError(
        'You cannot dib a gift that has been marked received.'
      );
    }

    const foundDib = gift.dibs.find((dib) => {
      return (dib._user.toString() === userId.toString());
    });

    if (foundDib) {
      throw new DibValidationError('You have already dibbed that gift.');
    }

    return gift;
  });
}

function createDib(req, res, next) {
  const giftId = req.body.giftId;
  const userId = req.user._id;

  getDibbableGift(giftId, userId)
    .then((gift) => validateDibQuantity(gift, req))
    .then((gift) => {
      gift.dibs.push({
        _gift: giftId,
        _user: req.user._id,
        quantity: req.body.quantity
      });

      return gift.save();
    })
    .then((doc) => {
      const dibId = doc.dibs[doc.dibs.length - 1]._id;
      authResponse({
        data: { dibId },
        message: 'Gift successfully dibbed!'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createDib
};

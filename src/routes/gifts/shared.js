const {
  GiftValidationError
} = require('../../shared/errors');

const {
  formatDibResponse
} = require('../dibs/shared');

function formatGiftResponse(gift, wishList, userId) {
  // Remove dibs if session user is owner of gift.
  const isGiftOwner = (wishList._user._id.toString() === userId.toString());
  if (isGiftOwner) {
    gift.dibs = [];
  }

  if (gift.dibs) {
    gift.dibs = gift.dibs.map((dib) => formatDibResponse(dib, userId));
  }

  gift.wishListId = wishList._id;
  gift.user = { ...wishList._user };
  gift.user.id = gift.user._id;
  gift.id = gift._id;

  delete gift.user._id;
  delete gift._id;

  return gift;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new GiftValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatGiftResponse,
  handleError
};

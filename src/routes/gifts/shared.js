const {
  GiftValidationError
} = require('../../shared/errors');

const {
  formatDibResponse
} = require('../dibs/shared');

function formatGiftResponse(gift, wishList, userId) {
  const clone = { ...gift };

  // Remove dibs if session user is owner of gift.
  const isGiftOwner = (wishList._user._id.toString() === userId.toString());

  if (isGiftOwner) {
    clone.dibs = [];
  }

  if (clone.dibs) {
    clone.dibs = clone.dibs.map((dib) => formatDibResponse(dib, userId));
  }

  clone.wishListId = wishList._id;
  clone.user = { ...wishList._user };
  clone.user.id = clone.user._id;
  clone.id = clone._id;

  delete clone.user._id;
  delete clone._id;

  return clone;
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

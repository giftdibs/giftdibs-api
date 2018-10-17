const {
  GiftValidationError
} = require('../../shared/errors');

const {
  formatCommentResponse
} = require('../comments/shared');

const {
  formatDibResponse
} = require('../dibs/shared');

function formatGiftResponse(gift, wishList, userId) {
  const clone = { ...gift };
  const isGiftOwner = (wishList._user._id.toString() === userId.toString());
  const wishListSummary = {
    id: wishList._id,
    name: wishList.name
  };

  // Remove dibs if session user is owner of gift and gift is not received.
  // TODO: If wish list is a registry, show dibs.
  if (isGiftOwner && !clone.dateReceived) {
    clone.dibs = [];
  }

  if (clone.comments) {
    clone.comments = clone.comments.map((comment) => {
      return formatCommentResponse(comment);
    });
  }

  if (clone.dibs) {
    clone.dibs = clone.dibs.map((dib) => formatDibResponse(dib, userId));
  }

  clone.wishList = wishListSummary;
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

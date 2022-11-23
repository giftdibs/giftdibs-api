const { GiftValidationError } = require('../../shared/errors');

const { formatCommentResponse } = require('../comments/shared');

const { formatDibResponse } = require('../dibs/shared');

function formatGiftResponse(gift, wishList, userId) {
  const clone = { ...gift };

  const isGiftOwner =
    clone._user && clone._user._id.toString() === userId.toString();

  // Remove dibs if session user is owner of gift and gift is not received.
  if (wishList.type !== 'registry' && isGiftOwner && !clone.dateReceived) {
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

  // Only format the wish list if it has been populated.
  if (clone._wishList && clone._wishList.name) {
    clone.wishList = { ...clone._wishList };
    clone.wishList.id = clone._wishList._id;
    delete clone.wishList._id;
  }

  // Only format the wish list if it has been populated.
  if (clone._user && clone._user.firstName) {
    clone.user = { ...clone._user };
    clone.user.id = clone.user._id;
    delete clone.user._id;
  }

  clone.id = clone._id;
  delete clone._id;
  delete clone._user;
  delete clone._wishList;

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
  handleError,
};

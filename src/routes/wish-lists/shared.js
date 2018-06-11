const {
  WishListValidationError
} = require('../../shared/errors');

const {
  formatGiftResponse
} = require('../gifts/shared');

function formatWishListResponse(wishList, userId) {
  if (wishList.gifts) {
    wishList.gifts = wishList.gifts.map((gift) => {
      return formatGiftResponse(gift, wishList, userId);
    });
  }

  const privacy = wishList.privacy || {};
  wishList.privacy = Object.assign({
    type: 'everyone',
    _allow: []
  }, privacy);

  wishList.user = { ...wishList._user };
  wishList.user.id = wishList.user._id;
  wishList.id = wishList._id;

  delete wishList._user;
  delete wishList.user._id;
  delete wishList._id;

  return wishList;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new WishListValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function sanitizeRequestBody(reqBody) {
  const clone = { ...reqBody };

  clone.privacy = clone.privacy || {};

  if (clone.privacy.type === 'custom') {
    if (
      !clone.privacy.allowedUserIds ||
      clone.privacy.allowedUserIds.length === 0
    ) {
      throw new WishListValidationError('Please select at least one user.');
    } else {
      // Filter out any duplicate user ids.
      // https://stackoverflow.com/a/15868720/6178885
      clone.privacy.allowedUserIds = [...new Set(clone.privacy.allowedUserIds)];
    }
  } else {
    // Make sure to clear out the allowedUserIds array.
    clone.privacy.allowedUserIds = [];
  }

  // Map the request fields to the database fields:
  clone.privacy._allow = clone.privacy.allowedUserIds;
  delete clone.privacy.allowedUserIds;

  return clone;
}

module.exports = {
  formatWishListResponse,
  handleError,
  sanitizeRequestBody
};

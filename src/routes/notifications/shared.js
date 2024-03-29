const { NotificationValidationError } = require('../../shared/errors');

function formatNotificationResponse(notification) {
  const clone = { ...notification };

  clone.userId = clone._user;
  clone.id = clone._id;

  if (clone.gift && clone.gift.dibs && clone.gift.dibs.length) {
    clone.gift.dibs.forEach((dib) => {
      delete dib._id;
    });
  }

  delete clone._user;
  delete clone._id;

  return clone;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new NotificationValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatNotificationResponse,
  handleError,
};

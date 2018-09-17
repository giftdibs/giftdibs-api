const {
  DibValidationError
} = require('../../shared/errors');

function formatDibResponse(dib, userId) {
  const clone = { ...dib };
  const dibId = clone._user._id || clone._user;

  const isDibOwner = (
    dibId.toString() === userId.toString()
  );

  if (clone.isAnonymous && !isDibOwner) {
    clone.user = {};
  } else {
    clone.user = { ...clone._user };
    clone.user.id = clone.user._id;
  }

  clone.id = clone._id;

  delete clone._user;
  delete clone._id;
  delete clone.user._id;

  return clone;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new DibValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatDibResponse,
  handleError
};

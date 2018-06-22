const {
  CommentValidationError
} = require('../../shared/errors');

function formatCommentResponse(comment) {
  const clone = { ...comment };

  clone.id = clone._id;
  clone.user = clone._user;
  clone.user.id = clone.user._id;

  delete clone._id;
  delete clone._user;
  delete clone.user._id;

  return clone;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new CommentValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatCommentResponse,
  handleError
};

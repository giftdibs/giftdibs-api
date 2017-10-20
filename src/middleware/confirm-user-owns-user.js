const { UserPermissionError } = require('../shared/errors');

function confirmUserOwnership(req, res, next) {
  const isOwner = (
    typeof req.user === 'object' &&
    req.user._id.toString() === req.params.userId.toString()
  );

  if (isOwner) {
    next();
    return;
  }

  next(new UserPermissionError());
}

module.exports = confirmUserOwnership;

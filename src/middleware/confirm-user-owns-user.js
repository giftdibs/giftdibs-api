const { UserPermissionError } = require('../shared/errors');

function confirmUserOwnership(req, res, next) {
  // Don't worry about the check if userId is not in the req parameters.
  if (req.params.userId === undefined) {
    next();
    return;
  }

  const isOwner = (typeof req.user === 'object' && req.user._id.equals(req.params.userId));

  if (isOwner) {
    next();
    return;
  }

  next(new UserPermissionError());
}

module.exports = confirmUserOwnership;

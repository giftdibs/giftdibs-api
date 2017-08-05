function confirmUserOwnership(req, res, next) {
  // Don't worry about the check if ID is not in the req parameters.
  if (req.params.userId === undefined) {
    next();
    return;
  }

  const isOwner = (typeof req.user === 'object' && req.user._id.equals(req.params.userId));

  if (isOwner) {
    next();
    return;
  }

  const err = new Error('Forbidden.');
  err.status = 403;
  err.code = 103;
  next(err);
}

module.exports = confirmUserOwnership;

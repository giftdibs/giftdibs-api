module.exports = (req, res, next) => {
  // Don't worry about the check if ID is not in the req parameters.
  if (req.params.id === undefined) {
    next();
    return;
  }

  const isOwner = (typeof req.user === 'object' && req.user._id.equals(req.params.id));

  if (isOwner) {
    next();
    return;
  }

  const err = new Error('Forbidden.');
  err.status = 403;
  next(err);
};

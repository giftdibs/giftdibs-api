module.exports = (req, res, next) => {
  if (req.user._id.equals(req.params.id)) {
    const err = new Error('Forbidden.');
    err.status = 403;
    next(err);
    return;
  }

  next();
};

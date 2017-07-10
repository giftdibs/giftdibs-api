const formatSchemaCastError = (err, req, res, next) => {
  if (err.name !== 'CastError') {
    next(err);
    return;
  }

  err.status = 400;
  err.message = 'The ID provided is not formatted correctly.';
  err.code = 1;
  next(err);
};

module.exports = formatSchemaCastError;

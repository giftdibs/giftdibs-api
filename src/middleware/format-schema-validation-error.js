const formatSchemaValidationError = (err, req, res, next) => {
  if (err.name.indexOf('ValidationError') === -1) {
    next(err);
    return;
  }

  const errors = [];

  // Skip if error already formatted.
  if (Array.isArray(err.errors)) {
    next(err);
    return;
  }

  for (const field in err.errors) {
    errors.push({
      message: err.errors[field].message,
      field,
    });
  }

  err.errors = errors;
  err.status = 400;

  next(err);
};

module.exports = formatSchemaValidationError;

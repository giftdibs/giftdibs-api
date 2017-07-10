const formatSchemaValidationError = (err, req, res, next) => {
  if (err.name !== 'ValidationError') {
    next(err);
    return;
  }

  let errors = [];

  for (const field in err.errors) {
    errors.push({
      message: err.errors[field].message,
      field: field
    });
  }

  err.errors = errors;

  next(err);
};

module.exports = formatSchemaValidationError;

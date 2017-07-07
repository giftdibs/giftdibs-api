module.exports = (err, req, res, next) => {
  const statusCode = err.status || 404;
  let result = {
    message: err.message,
    name: err.name
  };

  if (err.errors) {
    result.errors = err.errors;
  }

  res.status(statusCode).json(result);
};

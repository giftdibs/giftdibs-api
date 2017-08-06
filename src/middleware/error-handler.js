module.exports = (err, req, res, next) => {
  const statusCode = err.status || 404;
  const result = {
    message: err.message,
    code: err.code || 0
  };

  result.errors = err.errors || [];

  res.status(statusCode).json(result);
};

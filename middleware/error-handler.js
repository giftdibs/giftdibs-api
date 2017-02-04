module.exports = (err, req, res, next) => {
  let statusCode = err.status || 404;
  res.status(statusCode).json({
    message: err.message,
    name: err.name
  });
};

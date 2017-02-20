module.exports = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://giftdibs.com');
  next();
};

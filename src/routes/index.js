module.exports = [
  require('./auth').router,
  require('./auth-facebook').router,
  require('./dibs').router,
  require('./friendships').router,
  require('./gifts').router,
  require('./users').router,
  require('./wish-lists').router
];

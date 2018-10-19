module.exports = [
  require('./auth').router,
  require('./auth-facebook').router,
  require('./comments'),
  require('./dibs'),
  require('./feedback'),
  require('./friendships'),
  require('./gifts'),
  require('./notifications'),
  require('./products'),
  require('./users'),
  require('./wish-lists'),
  require('./assets')
];

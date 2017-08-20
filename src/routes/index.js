module.exports = [
  require('./auth').router,
  require('./auth-facebook').router,
  require('./users').router,
  require('./wish-lists').router,
  require('./gifts').router,
  require('./scrape-product-page').router
];

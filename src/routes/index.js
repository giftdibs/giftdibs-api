const env = require('../shared/environment');

const routers = [
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

if (env.get('NODE_ENV') === 'development') {
  routers.push(
    require('./admin')
  );
}

module.exports = routers;

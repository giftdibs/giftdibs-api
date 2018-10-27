const env = require('./shared/environment');
env.applyEnvironment();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('./shared/logger');

const db = require('./database');
db.connect();

const app = express();
app.set('port', env.get('PORT'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '2mb'
}));

const allowedOrigins = env.get('ALLOW_ORIGINS');
if (!allowedOrigins) {
  logger.error('Please provide allowed origins.');
  process.exit(1);
}

const whitelist = allowedOrigins.split(',');

app.use(cors({
  methods: 'GET,POST,PATCH,DELETE,OPTIONS',
  optionsSuccessStatus: 200,
  origin: (origin, callback) => {
    const isAllowed = (
      // No origin means "same origin":
      // See: https://github.com/expressjs/cors/issues/118
      origin === undefined ||

      whitelist.indexOf(origin) !== -1 ||

      // Check if the request is coming from a Chrome extension.
      (origin && origin.indexOf('chrome-extension://') === 0)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(
        new Error(`The domain ${origin} is not allowed access.`)
      );
    }
  }
}));
app.options('*', cors());

const passport = require('passport');
passport.use(require('./strategies/jwt'));
passport.use(require('./strategies/local'));
app.use(passport.initialize());

app.use('/v1', require('./routes'));

app.use(require('./middleware/404'));
app.use(require('./middleware/format-schema-validation-error'));
app.use(require('./middleware/format-schema-cast-error'));
app.use(require('./middleware/error-handler'));

module.exports = app;

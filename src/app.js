require('./shared/environment').applyEnvironment();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const db = require('./database');
db.connect();

const app = express();
app.set('port', process.env.PORT);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '2mb'
}));

const whitelist = process.env.ALLOW_ORIGINS.split(',');

app.use(cors({
  methods: 'GET,POST,PATCH,DELETE,OPTIONS',
  optionsSuccessStatus: 200,
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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

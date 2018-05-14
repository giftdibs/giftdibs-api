require('./shared/environment').applyEnvironment();

const express = require('express');
const bodyParser = require('body-parser');
// const cors = require('cors');

const db = require('./database');
db.connect();

const app = express();
app.all('*', (req, res, next) => {
  console.log('origin:', req.get('origin'));
  // const origin = req.get('origin');
  res.header('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
// console.log('Adding CORS access for:', process.env.ALLOW_ORIGIN);
// app.use(cors({
//   methods: 'GET,POST,PATCH,DELETE,OPTIONS',
//   optionsSuccessStatus: 200,
//   origin: process.env.ALLOW_ORIGIN
// }));
app.set('port', process.env.PORT);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

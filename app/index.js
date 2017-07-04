require('./environment');

const express = require('express');
const bodyParser = require('body-parser');

const db = require('./database');
db.connect();

const app = express();
app.set('port', process.env.PORT);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Passport
const passport = require('passport');
passport.use(require('./strategies/facebook'));
passport.use(require('./strategies/jwt'));
passport.use(require('./strategies/local'));
app.use(passport.initialize());

app.use(require('./middleware/access-control'));
app.use('/', require('./routes'));
app.use(require('./middleware/404'));
app.use(require('./middleware/error-handler'));

module.exports = app;

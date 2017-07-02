require('./environment');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');

const db = require('./database');
db.connect();

const app = express();
app.set('port', process.env.PORT);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(require('./strategies/facebook'));

app.use(require('./middleware/access-control'));
app.use('/', require('./routes'));
app.use(require('./middleware/404'));
app.use(require('./middleware/error-handler'));

module.exports = app;

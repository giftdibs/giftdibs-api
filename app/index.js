const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();

app.set('port', process.env.PORT || 8080);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

db.connect();

app.use(require('./middleware/access-control'));
app.use('/', require('./routes'));
app.use(require('./middleware/404'));
app.use(require('./middleware/error-handler'));

module.exports = app;

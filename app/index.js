const express = require('express');
const app = express();

app.set('port', 8080);

app.use(require('./middleware/access-control'));
app.use('/*', require('./routes'));
app.use(require('./middleware/404'));
app.use(require('./middleware/error-handler'));

module.exports = app;

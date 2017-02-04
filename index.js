const express = require('express');
const errorHandler = require('./middleware/error-handler');

const app = express();
app.set('port', 8080);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://giftdibs.com');
  next();
});

app.use('/*', (req, res) => {
  res.json({ message: 'Success!' });
});

app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(errorHandler);

app.listen(app.get('port'), () => {
  console.log(`GiftDibs API listening on http://localhost:${app.get('port')}...`);
});

exports = app;

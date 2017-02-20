const app = require('./app');

app.listen(app.get('port'), () => {
  console.log(`GiftDibs API listening on http://localhost:${app.get('port')}...`);
});

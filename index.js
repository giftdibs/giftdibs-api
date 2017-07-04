const app = require('./src/app');

app.listen(app.get('port'), () => {
  console.log(`GiftDibs API listening on http://localhost:${app.get('port')}`);
});

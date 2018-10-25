const app = require('./src/app');

app.listen(app.get('port'), () => {
  console.log(
    `GiftDibs API listening on http://localhost:${app.get('port')}`
  );
});

// The `app` is referenced in firebase.json `rewrites`.
const functions = require('firebase-functions');
exports.app = functions.https.onRequest(app);

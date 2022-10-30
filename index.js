const app = require('./src/app');

// The `app` is referenced in firebase.json `rewrites`.
const functions = require('firebase-functions');
exports.app = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB'
}).https.onRequest(app);

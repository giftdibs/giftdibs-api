const fs = require('fs');

const sql = fs.readFileSync('./src/database/schemas/member.sql').toString();

const environment = require('../src/shared/environment.js');
environment.applyEnvironment();

const db = require('../src/database');
db.connect();

db.query('DROP TABLE IF EXISTS member')
  .then(() => db.query(sql))
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.log('ERROR', err);
    process.exit(1);
  });

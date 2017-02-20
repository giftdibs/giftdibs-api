
const bluebird = require('bluebird');
const path = require('path');
const pgPromise = require('pg-promise');
const pgp = pgPromise({
  promiseLib: bluebird
});

const sql = pgp.utils.enumSql(path.join(__dirname, 'sql'), { recursive: true }, file => {
  return new pgp.QueryFile(file, {
    minify: true,
    params: {
      schema: 'giftdibs'
    }
  });
});

const connection = {
  host: 'localhost',
  port: 5432,
  database: 'giftdibs',
  user: 'postgres',
  password: 'test'
};

const db = pgp(connection);

module.exports = { db, pgp, sql };

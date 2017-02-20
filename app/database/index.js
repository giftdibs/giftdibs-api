
const bluebird = require('bluebird');
const path = require('path');
const pgPromise = require('pg-promise');
const pgp = pgPromise({
  promiseLib: bluebird
});

const sql = pgp.utils.enumSql(path.join(__dirname, 'sql'), { recursive: true }, file => {
  return new pgp.QueryFile(file, {
    minify: true,
    params: { schema: 'public' }
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

// Create the users table
db.query(sql.user.create.query).catch((error) => {
  console.log(error.message);
});

module.exports = { db, pgp };

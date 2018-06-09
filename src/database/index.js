const logger = require('winston');

const {
  Pool
} = require('pg');

let pool;

module.exports = {
  connect() {
    pool = new Pool({
      connectionString: process.env.DATABASE_URI,
      ssl: true
    });

    pool.on('error', (err) => {
      logger.error('idle client error', err.message, err.stack);
    });

    // pool.query('SELECT NOW()', (err, res) => {
    //   if (err) {
    //     logger.error('CONNECTION ERROR!', err);
    //   } else {
    //     logger.log('Database successfully connected.')
    //   }

    //   pool.end();
    // });
  },
  query: (text, params) => {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      pool.query(text, params, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = Date.now() - start;

        logger.log('executed query', {
          text,
          duration,
          rows: res.rowCount
        });

        resolve(res);
      });
    });
  }
};

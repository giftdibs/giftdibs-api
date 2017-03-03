const Promise = require('bluebird');
const { db, sql } = require('../../app/database');

Promise.settle([
  db.query(sql.user.truncate)
]).then(results => {
  let rejections = results.filter(result => result.isRejected());
  rejections.forEach(rejection => console.log('Warning:', rejection.reason().message));
  console.log('Database truncated successfully! :^)');
  process.exit();
}).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

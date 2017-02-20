const { db, sql } = require('../../app/database');

db.query(sql.user.create.query).then(() => {
  return db.tx(tag => {
    return tag.batch([
      db.query(sql.user.truncate.query),
      db.one(sql.user.insert.query, ['Steve', 'Brush', 'stevebrush@aol.com']),
      db.one(sql.user.insert.query, ['David', 'Jones', 'stevo.brush@gmail.com']),
      db.one(sql.user.insert.query, ['Sally', 'Hendricks', 'stevo.brush@yahoo.com'])
    ]);
  }).then(results => {
    console.log('Database successfully created! :^D');
    process.exit();
    return;
  });
}).catch(error => {
  console.error(error);
  process.exit(1);
  return;
});



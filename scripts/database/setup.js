const { db, sql } = require('../../app/database');

db.query(sql.user.create).then(() => {
  return db.tx(tag => {
    return tag.batch([
      db.query(sql.user.truncate),
      db.one(sql.user.insert, ['Steve', 'Brush', 'stevebrush@aol.com']),
      db.one(sql.user.insert, ['David', 'Jones', 'stevo.brush@gmail.com']),
      db.one(sql.user.insert, ['Sally', 'Hendricks', 'stevo.brush@yahoo.com'])
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



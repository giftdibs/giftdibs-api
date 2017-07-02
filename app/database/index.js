const mongoose = require('mongoose');
mongoose.Promise = Promise;

const databaseUri = process.env.DATABASE_URI;

module.exports = {
  connect: () => {
    mongoose.connect(databaseUri);

    const db = mongoose.connection;

    db.on('error', () => {
      console.log('Database connection error.');
    });

    db.once('open', () => {
      console.log(`Database connected at ${databaseUri}`);
    });
  }
};

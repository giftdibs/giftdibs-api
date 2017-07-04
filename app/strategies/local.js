const LocalStrategy = require('passport-local').Strategy;
const User = require('../database/models/user');

const config = {
  usernameField: 'emailAddress'
};

const strategy = new LocalStrategy(config, (emailAddress, password, done) => {
  User
    .find({ emailAddress })
    .limit(1)
    .exec()
    .then(results => {
      const user = results[0];

      if (!user) {
        done(null, false, { message: 'Invalid email address.' });
        return;
      }

      user
        .validatePassword(password)
        .then(() => {
          user.dateLastLoggedIn = new Date();
          user
            .save()
            .then(() => done(null, user));
        })
        .catch(() => {
          done(null, false, { message: 'Invalid password.' })
        });
    })
    .catch(err => done(err));
});

module.exports = strategy;

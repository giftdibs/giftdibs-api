const LocalStrategy = require('passport-local').Strategy;
const User = require('../database/models/user');

const config = {
  usernameField: 'emailAddress'
};

const verify = (emailAddress, password, done) => {
  User
    .find({ emailAddress })
    .limit(1)
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
};

const strategy = new LocalStrategy(config, verify);

module.exports = strategy;

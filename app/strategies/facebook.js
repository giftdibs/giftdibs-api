const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../database/models/user');

const config = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `http://localhost:8080/auth/facebook/callback`,
  profileFields: ['id', 'email', 'first_name', 'last_name'],
  enableProof: true
};

const verify = (accessToken, refreshToken, profile, cb) => {
  User
    .find({ facebookId: profile.id })
    .limit(1)
    .exec()
    .then(users => {
      let user = users[0];
      if (user) {
        return cb(undefined, user);
      }

      const newUser = new User({
        emailAddress: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        dateCreated: new Date(),
        dateUpdated: new Date()
      });

      newUser
        .save()
        .then(doc => cb(undefined, doc))
        .catch(cb);
    });
};

const strategy = new FacebookStrategy(config, verify);

module.exports = strategy;

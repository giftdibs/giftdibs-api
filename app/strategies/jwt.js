const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../database/models/user');

let config = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true
}

const verify = (req, payload, done) => {
  User
    .find({ _id: payload.id })
    .limit(1)
    .then(results => {
      const user = results[0];

      if (!user) {
        done(undefined, false, { message: 'Invalid token.' });
        return;
      }

      req.user = user;
      done(undefined, user);
    })
    .catch(err => done(err, false));
};

const strategy = new JwtStrategy(config, verify);

module.exports = strategy;

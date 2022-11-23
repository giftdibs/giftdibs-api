const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const { User } = require('../database/models/user');
const env = require('../shared/environment');

const strategyConfig = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: env.get('JWT_SECRET'),
  passReqToCallback: true,
  jsonWebTokenOptions: {
    maxAge: '24h',
  },
};

const verify = (req, payload, done) => {
  User.find({ _id: payload.id })
    .limit(1)
    .then((results) => {
      const user = results[0];

      if (!user) {
        done(undefined, false, {
          message: 'A user was not found that matched that access token.',
        });
        return;
      }

      req.user = user;

      done(undefined, user);
    })
    .catch((err) => done(err, false));
};

const strategy = new JwtStrategy(strategyConfig, verify);

module.exports = strategy;

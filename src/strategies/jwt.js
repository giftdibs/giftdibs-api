const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const db = require('../database');

const strategyConfig = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
  jsonWebTokenOptions: {
    maxAge: '15m'
  }
}

function verify(req, payload, done) {
  db.query(
    `SELECT
      id, first_name, last_name, email_address, password
    FROM member
    WHERE id=$1`,
    [payload.id]
  )
    .then((result) => {
      if (result.rows.length > 0) {
        const user = result.rows[0];

        // Save user to the request so middleware can access it.
        req.user = user;

        done(undefined, user);
        return;
      }

      done(undefined, false, {
        message: 'A user was not found that matched that access token.'
      });
    })
    .catch(done);
}

const strategy = new JwtStrategy(strategyConfig, verify);

module.exports = strategy;

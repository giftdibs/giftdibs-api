const LocalStrategy = require('passport-local').Strategy;
const db = require('../database');
const { Member } = require('../database/models/member');

const strategyConfig = {
  usernameField: 'email_address'
};

function verify(emailAddress, password, done) {
  db.query(
    `SELECT
      id, first_name, last_name, email_address, password
    FROM member
    WHERE email_address=$1`,
    [emailAddress]
  )
    .then((result) => {
      if (result.rows.length > 0) {
        const member = new Member(result.rows[0]);

        return member.confirmPassword(password)
          .then(() => {
            // TODO: Update user's date last logged in!
            member.set('date_last_logged_in', new Date());
            return member.save();
          });
      }

      done(null, false, {
        message: 'A member with that email address was not found.'
      });
    })
    .then((member) => {
      done(null, member);
    })
    .catch(done);
}

const strategy = new LocalStrategy(strategyConfig, verify);

module.exports = strategy;

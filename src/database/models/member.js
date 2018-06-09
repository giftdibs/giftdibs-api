const db = require('../index');

function Member(fields) {
  const bcrypt = require('bcrypt');
  const randomstring = require('randomstring');

  this.attributes = {};

  Object.assign(this.attributes, fields);

  this.set = (field, value) => {
    this.attributes[field] = value;
  };

  this.confirmPassword = (password) => {
    const error = new Error('That password did not match what we have on record.');
    error.status = 400;
    error.code = 101;

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, this.attributes.password)
        .then((valid) => {
          if (valid) {
            resolve(this);
          } else {
            reject(error);
          }
        })
        .catch(() => reject(error));
    });
  };

  this.save = () => {
    if (this.attributes.id) {
      return db.query(
        `UPDATE member
        SET first_name=$1, last_name=$2, email_address=$3, password=$4
        WHERE id=$5`,
        [
          this.attributes['first_name'],
          this.attributes['last_name'],
          this.attributes['email_address'],
          this.attributes['password'],
          this.attributes['id']
        ]
      ).then(() => {
        return this.attributes;
      });
    }

    return db.query(
      `INSERT INTO member
        (first_name, last_name, email_address, password)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *`,
      [
        this.attributes['first_name'],
        this.attributes['last_name'],
        this.attributes['email_address'],
        this.attributes['password']
      ]
    ).then((result) => {
      return result.rows[0];
    });
  };

  this.resetEmailAddressVerification = () => {
    this.attributes.email_address_verified = false;
    this.attributes.email_address_verification_token = randomstring.generate();
    // TODO: Send email with token.
    console.log([
      'Verify email here:',
      `http://localhost:4200/account/verify/${this.attributes.email_address_verification_token}`
    ].join(' '));
  };

  this.setPassword = (password) => {
    const saltRounds = 10;
    const PASSWORD_MIN_LENGTH = 7;
    const PASSWORD_MAX_LENGTH = 50;

    const error = new Error();
    error.name = 'ValidationError';
    error.status = 400;
    error.errors = {
      password: {
        path: 'password'
      }
    };

    password = (password || '').trim();

    if (!password) {
      error.errors.password.message = 'Please provide a password.';
      return Promise.reject(error);
    }

    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      error.errors.password.message = [
        `Your password must be between ${PASSWORD_MIN_LENGTH}`,
        `and ${PASSWORD_MAX_LENGTH} characters long.`
      ].join(' ');
      return Promise.reject(error);
    }

    return bcrypt.hash(password, saltRounds)
      .then((hash) => {
        this.attributes.password = hash;
        return this;
      });
  };
}

module.exports = {
  Member
};

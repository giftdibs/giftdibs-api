const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { isEmail, isAlpha } = require('validator');
const hasDuplicateChars = (str) => {
  let regex = /(.)\1{2,}/;
  return !regex.test(str);
};

const Schema = mongoose.Schema;
const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide a first name.'],
    trim: true,
    maxlength: [50, 'Your first name cannot be longer than 50 characters.'],
    minlength: [1, 'Your first name must be at least one (1) character long.'],
    validate: [
      {
        type: 'hasDuplicateChars',
        validator: hasDuplicateChars,
        message: 'Your first name cannot contain characters that repeat more than three (3) times.'
      },
      {
        type: 'isAlpha',
        validator: isAlpha,
        message: 'Your first name may only contain letters.',
        isAsync: false
      }
    ]
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name.'],
    trim: true,
    maxlength: [50, 'Your last name cannot be longer than 50 characters.'],
    minlength: [1, 'Your last name must be at least one (1) character long.'],
    validate: [
      {
        type: 'hasDuplicateChars',
        validator: hasDuplicateChars,
        message: 'Your last name cannot contain characters that repeat more than three (3) times.'
      },
      {
        type: 'isAlpha',
        validator: isAlpha,
        message: 'Your last name may only contain letters.',
        isAsync: false
      }
    ]
  },
  emailAddress: {
    type: String,
    required: [true, 'Please provide an email address.'],
    lowercase: true,
    unique: [true, 'An account with that email address already exists.'],
    trim: true,
    validate: {
      type: 'isEmail',
      validator: isEmail,
      message: 'The email address you provided is not formatted correctly.',
      isAsync: false
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a valid password.']
  },
  dateLastLoggedIn: {
    type: Date,
    required: true
  }
}, {
  collection: 'User',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

userSchema.methods.validatePassword = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt
      .compare(password, this.password)
      .then(valid => {
        if (valid) {
          resolve();
        } else {
          const err = new Error('Password invalid.');
          err.status = 401;
          reject(err);
        }
      });
  });
};

userSchema.methods.setPassword = function (password) {
  const saltRounds = 10;
  return bcrypt
    .hash(password, saltRounds)
    .then(hash => {
      this.password = hash;
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;

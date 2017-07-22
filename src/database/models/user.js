const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const { isEmail, isAlpha } = require('validator');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');

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
  emailAddressVerified: {
    type: Boolean,
    default: false
  },
  emailAddressVerificationToken: String,
  password: {
    type: String,
    required: [true, 'Please provide a valid password.']
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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
          reject(new Error('Password invalid.'));
        }
      });
  });
};

userSchema.methods.setPassword = function (password) {
  const saltRounds = 10;
  const PASSWORD_MIN_LENGTH = 7;
  const PASSWORD_MAX_LENGTH = 50;

  let error = new Error();
  error.name = 'ValidationError';
  error.status = 400;
  error.errors = {
    password: {
      path: 'password'
    }
  };

  password = password.trim();

  if (!password) {
    error.errors.password.message = 'Please provide a password.';
    return Promise.reject(error);
  }

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    error.errors.password.message = `Your password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters long.`;
    return Promise.reject(error);
  }

  return bcrypt
    .hash(password, saltRounds)
    .then(hash => {
      this.password = hash;
    });
};

userSchema.methods.setResetPasswordToken = function () {
  this.resetPasswordToken = randomstring.generate();
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  // TODO: Remove this after implementing email service.
  console.log('reset password token:', this.resetPasswordToken);
};

userSchema.methods.unsetResetPasswordToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

userSchema.methods.resetEmailAddressVerification = function () {
  this.emailAddressVerified = false;
  this.emailAddressVerificationToken = randomstring.generate();
  // TODO: Send email with token.
  console.log('email verification token:', this.emailAddressVerificationToken);
};

// Maybe this should be a global schema method? Or, should we require login?
userSchema.methods.verifyEmailAddress = function (token) {
  if (this.emailAddressVerificationToken === token) {
    this.emailAddressVerified = true;
    this.emailAddressVerificationToken = undefined;
    return true;
  }

  return false;
};

userSchema.plugin(MongoDbErrorHandlerPlugin);

const User = mongoose.model('User', userSchema);

module.exports = User;

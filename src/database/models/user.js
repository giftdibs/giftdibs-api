const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');

const {
  isEmail,
  isAlpha
} = require('validator');

const {
  updateDocument
} = require('../utils/update-document');

const {
  UserNotFoundError,
  UserPermissionError,
  UserValidationError
} = require('../../shared/errors');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

function hasDuplicateChars(str) {
  let regex = /(.)\1{2,}/;
  return !regex.test(str);
}

function getAge(birthDate) {
  const today = new Date();
  // const birthDate = new Date(dateString);
  const m = today.getMonth() - birthDate.getMonth();

  let age = today.getFullYear() - birthDate.getFullYear();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

const Schema = mongoose.Schema;
const userSchema = new Schema({
  avatarUrl: String,
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
        message: [
          'Your first name cannot contain characters',
          'that repeat more than three (3) times.'
        ].join(' ')
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
        message: [
          'Your last name cannot contain characters',
          'that repeat more than three (3) times.'
        ].join(' ')
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
  birthday: {
    type: Date,
    required: true,
    validate: {
      type: 'ageGate',
      validator: function (value) {
        const age = getAge(value);

        return (age >= 13);
      },
      message: 'You must be 13 years old or older to use GiftDibs.',
      isAsync: false
    }
  },
  facebookId: String,
  dateLastLoggedIn: {
    type: Date,
    required: true
  }
}, {
  collection: 'user',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

userSchema.methods.confirmPassword = function (password) {
  const error = new Error(
    'That password did not match what we have on record.'
  );
  error.status = 400;
  error.code = 101;

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, this.password)
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

userSchema.methods.setPassword = function (password) {
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
      this.password = hash;
      return this;
    });
};

userSchema.methods.setResetPasswordToken = function () {
  this.resetPasswordToken = randomstring.generate();
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
};

userSchema.methods.unsetResetPasswordToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

userSchema.methods.resetEmailAddressVerification = function () {
  this.emailAddressVerified = false;
  this.emailAddressVerificationToken = randomstring.generate();
};

userSchema.methods.verifyEmailAddress = function (token) {
  if (this.emailAddressVerificationToken === token) {
    this.emailAddressVerified = true;
    this.emailAddressVerificationToken = undefined;
    return true;
  }

  return false;
};

userSchema.methods.updateSync = function (values) {
  const fields = [
    'birthday',
    'firstName',
    'lastName',
    'emailAddress',
    'facebookId'
  ];

  updateDocument(this, fields, values);

  return this;
};

function removeReferencedDocuments(user, next) {
  const { Friendship } = require('./friendship');
  const { Notification } = require('./notification');
  const { WishList } = require('./wish-list');

  const userId = user._id;

  Promise.all([
    WishList.remove({ _user: userId }),
    Friendship.remove({
      $or: [
        { _user: userId },
        { _friend: userId }
      ]
    }),
    Notification.remove({ _user: userId })
  ])
    .then(() => next())
    .catch(next);
}

userSchema.post('remove', removeReferencedDocuments);

userSchema.plugin(MongoDbErrorHandlerPlugin);

userSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new UserValidationError('Please provide a user ID.'),
    notFound: new UserNotFoundError(),
    permission: new UserPermissionError()
  },
  userIdField: '_id'
});

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  removeReferencedDocuments
};

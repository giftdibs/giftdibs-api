const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
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

const User = mongoose.connection.model('User', userSchema);

module.exports = User;

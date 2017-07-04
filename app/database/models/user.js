const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  facebookId: Number,
  dateCreated: {
    type: Date,
    required: true
  },
  dateUpdated: {
    type: Date,
    required: true
  }
}, {
  collection: 'User'
});

userSchema.methods.validatePassword = function (password) {
  return new Promise((resolve, reject) => {
    bcrypt
      .compare(password, this.password)
      .then(valid => {
        if (valid) {
          resolve();
        } else {
          reject();
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

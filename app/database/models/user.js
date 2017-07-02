const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  emailAddress: String,
  dateCreated: Date,
  dateUpdated: Date
});

const User = mongoose.connection.model('User', userSchema);

module.exports = User;

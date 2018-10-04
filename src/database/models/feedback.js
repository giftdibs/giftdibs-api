const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const Schema = mongoose.Schema;
const feedbackSchema = new Schema({
  message: {
    type: String,
    trim: true,
    required: true,
    maxlength: [
      2000,
      'Feedback messages cannot be longer than 2000 characters.'
    ],
    validate: {
      type: 'isEmpty',
      validator: function (value) {
        if (!value) {
          return false;
        }

        return true;
      },
      message: 'Feedback messages cannot be empty.',
      isAsync: false
    }
  },
  reason: {
    type: String,
    enum: [
      'abuse',
      'account',
      'bug',
      'inquiry'
    ],
    default: 'inquiry'
  },
  referrer: {
    type: String,
    maxlength: 1000
  }
}, {
  collection: 'feedback',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

feedbackSchema.plugin(MongoDbErrorHandlerPlugin);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = {
  Feedback
};

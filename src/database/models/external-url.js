const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const externalUrlSchema = new Schema({
  url: {
    type: String,
    trim: true,
    required: [true, 'Please provide a URL.'],
    maxlength: [500, 'The external URL cannot be longer than 500 characters.']
  },
  price: {
    type: Number,
    maxlength: [
      13,
      'The external URL\'s product price must be less than 1,000,000,000,000.'
    ]
  },
  dateScraped: Date
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

externalUrlSchema.methods.updateSync = function (values) {
  const fields = ['url', 'price', 'dateScraped'];

  // Reset the date scraped if the URL has changed.
  if (values.url && values.url !== this.url) {
    values.dateScraped = null;
  }

  updateDocument(this, fields, values);

  return this;
};

externalUrlSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = { externalUrlSchema };

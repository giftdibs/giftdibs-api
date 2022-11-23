const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin,
} = require('../plugins/mongodb-error-handler');

const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const externalUrlSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
      required: [true, 'Please provide a valid external link.'],
      maxlength: [
        500,
        'The external link cannot be longer than 500 characters.',
      ],
    },
  },
  {
    timestamps: {
      createdAt: 'dateCreated',
      updatedAt: 'dateUpdated',
    },
  }
);

externalUrlSchema.methods.updateSync = function (values) {
  const fields = ['url'];

  // Don't do anything if the URL is empty.
  if (!values.url || !values.url.trim()) {
    return this;
  }

  updateDocument(this, fields, values);

  return this;
};

externalUrlSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = { externalUrlSchema };

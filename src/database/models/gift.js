const mongoose = require('mongoose');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  budget: {
    type: Number,
    maxlength: [13, 'The gift\'s budget must be less than 1,000,000,000,000.']
  },
  externalUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'The gift\'s external URL cannot be longer than 500 characters.']
  }
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

giftSchema.methods.updateFields = function (fields, values) {
  updateDocument(this, fields, values);
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = giftSchema;

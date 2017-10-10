const mongoose = require('mongoose');
const externalUrlSchema = require('./external-url');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  budget: {
    type: Number,
    min: [0, 'The gift\'s budget must greater than zero.'],
    max: [1000000000000, 'The gift\'s budget must be less than 1,000,000,000,000.']
  },
  externalUrls: [externalUrlSchema],
  isReceived: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide a quantity.'],
    max: [1000000000000, 'The gift\'s quantity must be less than 1,000,000,000,000.']
  },
  order: {
    type: Number,
    min: [0, 'The gift\'s order must be greater than zero.']
  },
  priority: {
    type: Number,
    min: [0, 'The gift\'s priority must be greater than zero.'],
    max: [10, 'The gift\'s priority must be less than 10.']
  }
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

giftSchema.methods.update = function (values) {
  const fields = ['budget', 'isReceived', 'name', 'order', 'priority'];
  updateDocument(this, fields, values);
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = giftSchema;

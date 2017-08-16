const mongoose = require('mongoose');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [100, 'The gift\'s name cannot be longer than 100 characters.']
  }
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

giftSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = giftSchema;

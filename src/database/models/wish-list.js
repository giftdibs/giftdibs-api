const mongoose = require('mongoose');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');

const Schema = mongoose.Schema;
const wishListSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  name: {
    type: String,
    required: [true, 'Please provide a wish list name.'],
    trim: true,
    maxlength: [100, 'The wish list\'s name cannot be longer than 100 characters.']
  }
}, {
  collection: 'WishList',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

wishListSchema.plugin(MongoDbErrorHandlerPlugin);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;

const mongoose = require('mongoose');
const { updateDocument } = require('../utils/update-document');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

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
    maxlength: [
      100,
      'The wish list\'s name cannot be longer than 100 characters.'
    ]
  },
  privacy: {
    _allow: [],
    value: {
      type: String,
      enum: ['everyone', 'me', 'followers', 'custom']
    }
  }
}, {
  collection: 'wishlist',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

wishListSchema.methods.update = function (values) {
  const fields = ['name'];
  updateDocument(this, fields, values);
};

wishListSchema.plugin(MongoDbErrorHandlerPlugin);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList
};

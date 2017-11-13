const mongoose = require('mongoose');
const { updateDocument } = require('../utils/update-document');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
} = require('../../shared/errors');

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
  }
}, {
  collection: 'wishlist',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

wishListSchema.statics.confirmUserOwnership = function (wishListId, userId) {
  if (!wishListId) {
    return Promise.reject(
      new WishListValidationError('Please provide a wish list ID.')
    );
  }

  return this
    .find({ _id: wishListId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      if (userId.toString() !== wishList._user.toString()) {
        return Promise.reject(new WishListPermissionError());
      }

      return wishList;
    });
};

wishListSchema.methods.updateSync = function (values) {
  const fields = ['name'];

  updateDocument(this, fields, values);

  return this;
};

wishListSchema.plugin(MongoDbErrorHandlerPlugin);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList
};

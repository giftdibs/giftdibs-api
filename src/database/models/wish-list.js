const mongoose = require('mongoose');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
} = require('../../shared/errors');

const { ConfirmUserOwnershipPlugin } = require('../plugins/confirm-user-ownership');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');

function confirmUniqueUsers(value) {
  const found = this.privacy._allow.find((userId) => {
    return (userId.toString() === value);
  });

  return !!found;
}

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
    _allow: [{
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      validate: [{
        validator: confirmUniqueUsers,
        message: 'Two or more duplicate user IDs found. Only provide unique IDs.'
      }]
    }],
    type: {
      type: String,
      enum: ['everyone', 'me', 'friends', 'custom'],
      default: 'everyone'
    }
  }
}, {
  collection: 'wishlist',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

wishListSchema.methods.updateSync = function (values) {
  const fields = ['name'];

  updateDocument(this, fields, values);

  return this;
};

wishListSchema.plugin(MongoDbErrorHandlerPlugin);
wishListSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new WishListValidationError('Please provide a wish list ID.'),
    notFound: new WishListNotFoundError(),
    permission: new WishListPermissionError()
  }
});

function removeReferencedDocuments(doc, next) {
  const { Gift } = require('./gift');

  Gift
    .find({ _wishList: doc._id })
    .then((gifts) => {
      gifts.forEach((gift) => gift.remove());
      next();
    })
    .catch(next);
}

wishListSchema.post('remove', removeReferencedDocuments);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList,
  removeReferencedDocuments
};

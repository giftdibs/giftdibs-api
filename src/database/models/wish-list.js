const mongoose = require('mongoose');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
} = require('../../shared/errors');

const { ConfirmUserOwnershipPlugin } = require('../plugins/confirm-user-ownership');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const wishListSchema = new Schema({
  _gifts: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Gift'
  }],
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
      ref: 'User'
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

// TODO: Add method to verify unique gift ids.

wishListSchema.statics.sanitizeGiftsRequest = function (gifts) {

};

wishListSchema.statics.sanitizePrivacyRequest = function (privacy) {
  return new Promise((resolve, reject) => {
    if (!privacy) {
      resolve(privacy);
    }

    if (privacy.type === 'custom') {
      if (
        !privacy._allow ||
        privacy._allow.length === 0
      ) {
        reject(new WishListValidationError('Please select at least one user.'));
        return;
      } else {
        // Filter out any duplicate user ids.
        // https://stackoverflow.com/a/15868720/6178885
        privacy._allow = [...new Set(privacy._allow)];
      }
    } else {
      // Make sure to clear out the _allow array.
      privacy._allow = [];
    }

    resolve(privacy);
  });
};

wishListSchema.methods.updateSync = function (values) {
  const fields = [
    '_gifts',
    'name',
    'privacy'
  ];

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
  // TODO: Adjust this to remove gifts.
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

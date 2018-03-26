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

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

function confirmUniqueUsers(value) {
  const duplicates = this.privacy._allow.filter((userId) => {
    return (userId.toString() === value);
  })[0];

  return (duplicates.length > 0);
}

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
      enum: ['everyone', 'me', 'followers', 'custom'],
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

// wishListSchema.methods.setPrivacySync = function (formData = {}) {
//   const type = formData.privacyType;
//   const allow = formData.privacyAllow;

//   // Format the privacy request into something the database can use.
//   if (type) {
//     const privacy = {
//       value: type
//     };

//     if (type === 'custom') {
//       if (allow) {
//         const allowedIds = allow.split(',').map((userId) => {
//           return userId.trim();
//         });

//         if (allowedIds.length > 0) {
//           privacy._allow = allowedIds;
//         } else {
//           // throw error, custom setting needs user ids
//         }
//       }
//     }

//     this.privacy = privacy;
//   }

//   return this;
// };

wishListSchema.post('remove', removeReferencedDocuments);

wishListSchema.plugin(MongoDbErrorHandlerPlugin);
wishListSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new WishListValidationError('Please provide a wish list ID.'),
    notFound: new WishListNotFoundError(),
    permission: new WishListPermissionError()
  }
});

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList,
  removeReferencedDocuments
};

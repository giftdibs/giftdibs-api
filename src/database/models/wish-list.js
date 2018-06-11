const mongoose = require('mongoose');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
} = require('../../shared/errors');

const {
  GiftNotFoundError,
  GiftPermissionError
} = require('../../shared/errors');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  updateDocument
} = require('../utils/update-document');

const {
  giftSchema
} = require('./gift');

// const populateGiftFields = 'budget dibs isReceived name priority quantity';
const populateUserFields = 'firstName lastName';

const Schema = mongoose.Schema;
const wishListSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [
      true,
      'A user ID must be provided.'
    ]
  },
  gifts: [
    giftSchema
  ],
  name: {
    type: String,
    required: [
      true,
      'Please provide a wish list name.'
    ],
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

/**
 * Manual function to check if user can view wish list.
 * This is used, instead of a query, in order to alert
 * the user if they do not have permission (instead of
 * just returning a 404).
 * @param {string} userId
 * @param {*} wishList
 */
function isUserAuthorizedToViewWishList(userId, wishList) {
  const isOwner = (wishList._user._id.toString() === userId.toString());
  const privacy = wishList.privacy;
  const privacyType = privacy && privacy.type;

  // Owners of a wish list should always be authorized.
  if (isOwner) {
    return true;
  }

  let passes = false;
  switch (privacyType) {
    case 'me':
      passes = false;
      break;

    default:
    case 'everyone':
      passes = true;
      break;

    case 'custom':
      passes = !!wishList.privacy._allow.find((allowId) => {
        return (allowId.toString() === userId.toString());
      });
      break;
  }

  return passes;
}

function findOneAuthorizedByQuery(query, userId) {
  const wishListModel = this;

  return wishListModel.find(query)
    .limit(1)
    .populate('_user', populateUserFields)
    .lean()
    .then((objects) => {
      const wishList = objects[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      return wishList
    })
    .then((wishList) => {
      const isAuthorized = isUserAuthorizedToViewWishList(
        userId,
        wishList
      );

      if (!isAuthorized) {
        return Promise.reject(
          new WishListPermissionError(
            'You are not authorized to view that wish list.'
          )
        );
      }

      return wishList;
    });
}

wishListSchema.statics.findAuthorized = function (
  userId,
  query = {},
  raw = false
) {
  const wishListModel = this;

  const combined = {
    $and: [
      query,
      {
        // Only return results the current user can view.
        $or: [
          { _user: userId },
          { 'privacy.type': 'everyone' },
          { 'privacy._allow': userId }
        ]
      }
    ]
  };

  const promise = wishListModel.find(combined);

  if (!raw) {
    promise.populate('_user', populateUserFields)
      .sort('-dateUpdated')
      .lean();
  }

  return promise;
};

wishListSchema.statics.findAuthorizedById = function (wishListId, userId) {
  return findOneAuthorizedByQuery.call(
    this,
    { _id: wishListId },
    userId
  );
};

wishListSchema.statics.findAuthorizedByGiftId = function (giftId, userId) {
  return findOneAuthorizedByQuery.call(
    this,
    { 'gifts._id': giftId },
    userId
  );
};

wishListSchema.methods.updateSync = function (values) {
  const fields = [
    'name',
    'privacy'
  ];

  // TODO: If owner changes privacy of wish list,
  // remove dibs of people that no longer have permission!
  // (Need to alert user of this with a confirm in the app.)

  updateDocument(this, fields, values);

  return this;
};

wishListSchema.methods.addGiftSync = function (gift) {
  const instance = this;

  instance.gifts.push(gift);

  // Filter out any duplicate gifts.
  // https://stackoverflow.com/a/15868720/6178885
  instance.gifts = [...new Set(instance.gifts)];
};

wishListSchema.statics.confirmUserOwnershipByGiftId = function (
  giftId,
  userId
) {
  return WishList
    .find({
      'gifts._id': giftId
    })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new GiftNotFoundError());
      }

      if (userId.toString() !== wishList._user.toString()) {
        return Promise.reject(new GiftPermissionError());
      }

      return wishList;
    });
};

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
  WishList
};

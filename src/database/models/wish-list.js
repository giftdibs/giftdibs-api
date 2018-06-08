const mongoose = require('mongoose');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
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

const populateGiftFields = 'budget dibs isReceived name priority quantity';
const populateUserFields = 'firstName lastName';

const Schema = mongoose.Schema;
const wishListSchema = new Schema({
  _gifts: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Gift'
  }],
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [
      true,
      'A user ID must be provided.'
    ]
  },
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
    .populate('_gifts', populateGiftFields)
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

function formatWishListResponse(wishList, userId) {
  const { formatGiftResponse } = require('./gift');

  wishList.user = wishList._user;
  delete wishList._user;

  wishList.gifts = wishList._gifts;
  delete wishList._gifts;

  const privacy = wishList.privacy || {};
  wishList.privacy = Object.assign({
    type: 'everyone',
    _allow: []
  }, privacy);

  if (wishList.gifts) {
    wishList.gifts = wishList.gifts.map((gift) => {
      return formatGiftResponse(gift, wishList, userId);
    });
  }

  return wishList;
}

function removeReferencedDocuments(doc, next) {
  const { Gift } = require('./gift');

  Gift
    .find({ _id: doc._gifts })
    .then((gifts) => {
      gifts.forEach((gift) => gift.remove());
      next();
    })
    .catch(next);
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
        // Privacy
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
    promise.populate('_gifts', populateGiftFields)
      .populate('_user', populateUserFields)
      .sort('-dateUpdated')
      .lean();
  }

  return promise.then((wishLists) => {
    return wishLists
      // TODO: We now have two different ways to check authorized?
      // .filter((wishList) => {
      //   return isUserAuthorizedToViewWishList(
      //     userId,
      //     wishList
      //   );
      // })
      .map((wishList) => {
        if (raw) {
          return wishList;
        }

        return formatWishListResponse(wishList, userId);
      });
  });
};

wishListSchema.statics.findAuthorizedById = function (wishListId, userId) {
  return findOneAuthorizedByQuery.call(
    this,
    { _id: wishListId },
    userId
  ).then((wishList) => formatWishListResponse(wishList, userId));
};

wishListSchema.statics.findAuthorizedByGiftId = function (giftId, userId) {
  return findOneAuthorizedByQuery.call(
    this,
    { _gifts: giftId },
    userId
  ).then((wishList) => formatWishListResponse(wishList, userId));
};

wishListSchema.statics.sanitizeRequest = function (reqBody) {
  const clone = { ...reqBody };

  clone.privacy = clone.privacy || {};

  if (clone.privacy.type === 'custom') {
    if (
      !clone.privacy.allowedUserIds ||
      clone.privacy.allowedUserIds.length === 0
    ) {
      throw new WishListValidationError('Please select at least one user.');
    } else {
      // Filter out any duplicate user ids.
      // https://stackoverflow.com/a/15868720/6178885
      clone.privacy.allowedUserIds = [...new Set(clone.privacy.allowedUserIds)];
    }
  } else {
    // Make sure to clear out the allowedUserIds array.
    clone.privacy.allowedUserIds = [];
  }

  // Map the request fields to the database fields:
  clone.privacy._allow = clone.privacy.allowedUserIds;
  delete clone.privacy.allowedUserIds;

  return clone;
};

wishListSchema.methods.updateSync = function (values) {
  const fields = [
    'name',
    'privacy'
  ];

  // TODO: If gift owner changes privacy of wish list,
  // remove dibs of people that no longer have permission!
  // (Need to alert user of this with a confirm.)

  updateDocument(this, fields, values);

  return this;
};

wishListSchema.methods.addGiftSync = function (gift) {
  const instance = this;

  instance._gifts.push(gift._id);

  // Filter out any duplicate user ids.
  // https://stackoverflow.com/a/15868720/6178885
  instance._gifts = [...new Set(instance._gifts)];
};

wishListSchema.plugin(MongoDbErrorHandlerPlugin);
wishListSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new WishListValidationError('Please provide a wish list ID.'),
    notFound: new WishListNotFoundError(),
    permission: new WishListPermissionError()
  }
});

wishListSchema.post('remove', removeReferencedDocuments);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList,
  removeReferencedDocuments
};

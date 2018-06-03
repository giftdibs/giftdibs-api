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

const populateGiftFields = 'budget dibs isReceived name priority quantity';
const populateUserFields = 'firstName lastName';

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
  return this.find(query)
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
  wishList.user = wishList._user;
  delete wishList._user;

  wishList.gifts = wishList._gifts;
  delete wishList._gifts;

  const privacy = wishList.privacy || {};
  wishList.privacy = Object.assign({
    type: 'everyone',
    _allow: []
  }, privacy);

  // TODO:
  // Think of a better way to handle different populated fields
  // depending on the owner? (To make sure all routes are consistant.)
  if (wishList.gifts) {
    const isOwner = (userId.toString() === wishList.user._id.toString());
    wishList.gifts.forEach((gift) => {
      if (isOwner) {
        gift.dibs = [];
      } else if (gift.dibs) {
        gift.dibs.forEach((dib) => {
          // TODO: Find a consistent way to format
          // anonymous dibs across the app!
          const isDibOwner = (
            dib._user.toString() ===
            userId.toString()
          );
          if (dib.isAnonymous && !isDibOwner) {
            dib.user = {};
          } else {
            dib.user = {
              _id: dib._user
            };
          }

          delete dib._user;
        });
      }
    });
  }

  return wishList;
}

wishListSchema.statics.findAuthorized = function (userId, query = {}) {
  return this.find(query)
    .populate('_gifts', populateGiftFields)
    .populate('_user', populateUserFields)
    .sort('-dateUpdated')
    .lean()
    .then((wishLists) => {
      return wishLists
        .filter((wishList) => {
          return isUserAuthorizedToViewWishList(
            userId,
            wishList
          );
        })
        .map((wishList) => {
          return formatWishListResponse(wishList, userId);
        });
    })
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

// TODO: Add method to verify unique gift ids?
wishListSchema.statics.sanitizeGiftsRequest = function (gifts) {
  // Kinda like we're doing with duplicate user ids:
  // https://stackoverflow.com/a/15868720/6178885
  // privacy._allow = [...new Set(privacy._allow)];
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

  // TODO: If gift owner changes privacy of wish list,
  // remove dibs of people that no longer have permission!

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
    .find({ _id: doc._gifts })
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

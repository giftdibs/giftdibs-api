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

const {
  giftSchema
} = require('./gift');

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
  description: {
    type: String,
    trim: true,
    maxlength: [
      2000,
      'The description cannot be longer than 2000 characters.'
    ]
  },
  // TODO: Remove this array. Legacy.
  gifts: [
    giftSchema
  ],
  isArchived: {
    type: Boolean,
    default: false
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
      enum: ['everyone', 'me', 'custom'],
      default: 'everyone'
    }
  },
  type: {
    type: String,
    enum: ['wish-list', 'registry'],
    default: 'wish-list'
  }
}, {
  collection: 'wishlist',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

/**
 * Returns a query that specifically looks for wish lists
 * the session user has permission to view.
 * @param {*} userId
 * @param {*} query
 */
function getAuthorizedQuery(userId, query = {}) {
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

  return combined;
}

/**
 * Returns a query that will allow the WishList model to
 * look for friends' wish lists that the session user is
 * permitted to view.
 * @param {*} userId
 */
async function getAuthorizedFriendsQuery(userId) {
  const { Friendship } = require('./friendship');

  const friendships = await Friendship.getAllByUserId(userId);
  const friendIds = friendships.following.map((friendship) => friendship._id);

  // Also show current user's gifts.
  friendIds.push(userId);

  const query = {
    $or: [
      { isArchived: { $exists: false } },
      { isArchived: false }
    ],
    '_user': {
      $in: friendIds
    }
  };

  return query;
}

function findAuthorized(userId, query = {}) {
  const authorizedQuery = getAuthorizedQuery(userId, query);

  return this.find(authorizedQuery);
}

function updateSync(values) {
  const fields = [
    'description',
    'isArchived',
    'name',
    'privacy',
    'type'
  ];

  // TODO: If owner changes privacy of wish list,
  // remove dibs of people that no longer have permission!
  // (Need to alert user of this with a confirm in the app.)

  updateDocument(this, fields, values);

  return this;
}

wishListSchema.statics.getAuthorizedFriendsQuery =
  getAuthorizedFriendsQuery;

wishListSchema.statics.findAuthorized =
  findAuthorized;

wishListSchema.methods.updateSync =
  updateSync;

wishListSchema.plugin(MongoDbErrorHandlerPlugin);
wishListSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new WishListValidationError('Please provide a wish list ID.'),
    notFound: new WishListNotFoundError(),
    permission: new WishListPermissionError()
  }
});

wishListSchema.post('remove', function (wishList, next) {
  const { Gift } = require('./gift');

  Gift.find({
    '_wishList': wishList._id
  })
    .then((gifts) => {
      return Promise.all(
        gifts.map((gift) => gift.remove())
      );
    })
    .then(() => next())
    .catch(next);
});

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = {
  WishList
};

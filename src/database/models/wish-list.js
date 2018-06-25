const mongoose = require('mongoose');

const {
  WishListNotFoundError,
  WishListPermissionError,
  WishListValidationError
} = require('../../shared/errors');

const {
  CommentNotFoundError,
  CommentPermissionError,
  DibNotFoundError,
  DibPermissionError,
  DibValidationError,
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
function isUserAuthorizedToViewWishList(
  userId,
  wishList
) {
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

function findOneAuthorizedByQuery(
  query,
  userId,
  raw = false
) {
  const wishListModel = this;
  const promise = wishListModel.find(query)
    .limit(1)
    .populate('_user', populateUserFields)
    .populate('gifts.dibs._user', populateUserFields)
    .populate('gifts.comments._user', populateUserFields);

  if (!raw) {
    promise.lean();
  }

  return promise
    .then((objects) => {
      const wishList = objects[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

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

      return wishList
    });
}

function getDibById(dibId, wishList) {
  let dib;
  wishList.gifts.find((gift) => {
    dib = gift.dibs.id(dibId);
    return (dib !== undefined);
  });

  return dib;
}

function confirmDibUserOwnership(wishList, dibId, userId) {
  if (!wishList) {
    return Promise.reject(new DibNotFoundError());
  }

  const dib = getDibById(dibId, wishList);

  if (userId.toString() !== dib._user._id.toString()) {
    return Promise.reject(new DibPermissionError());
  }

  return Promise.resolve(dib);
}

function getCommentById(commentId, wishList) {
  let comment;
  wishList.gifts.find((gift) => {
    comment = gift.comments.id(commentId);
    return (comment !== undefined);
  });

  return comment;
}

function confirmCommentUserOwnership(wishList, commentId, userId) {
  if (!wishList) {
    return Promise.reject(new CommentNotFoundError());
  }

  const comment = getCommentById(commentId, wishList);

  if (userId.toString() !== comment._user._id.toString()) {
    return Promise.reject(new CommentPermissionError());
  }

  return Promise.resolve(comment);
}

function validateDibQuantity(gift, quantity = 1, dibId) {
  let totalDibs = quantity;

  return new Promise((resolve, reject) => {
    gift.dibs.forEach((dib) => {
      // Don't count the quantity of a dib that's being updated.
      if (dibId === dib._id.toString()) {
        return;
      }

      totalDibs += parseInt(dib.quantity, 10);
    });

    if (totalDibs > gift.quantity) {
      const err = new DibValidationError();

      err.errors = [{
        message: [
          'Dib quantity is more than are available.',
          'Please choose a smaller amount.'
        ].join(' '),
        field: 'quantity'
      }];

      reject(err);
      return;
    }

    resolve(gift);
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
    promise
      .populate('_user', populateUserFields)
      .populate('gifts.dibs._user', populateUserFields)
      .populate('gifts.comments._user', populateUserFields)
      .lean();
  }

  return promise;
};

wishListSchema.statics.findAuthorizedById = function (
  wishListId,
  userId
) {
  return findOneAuthorizedByQuery.call(
    this,
    { _id: wishListId },
    userId
  );
};

wishListSchema.statics.findAuthorizedByGiftId = function (
  giftId,
  userId,
  raw
) {
  return findOneAuthorizedByQuery.call(
    this,
    { 'gifts._id': giftId },
    userId,
    raw
  ).then((wishList) => {
    if (!wishList) {
      throw new GiftNotFoundError();
    }

    return wishList;
  });
};

wishListSchema.statics.findAuthorizedByCommentId = function (
  commentId,
  userId
) {
  return findOneAuthorizedByQuery.call(
    this,
    { 'gifts.comments._id': commentId },
    userId
  ).then((wishList) => {
    if (!wishList) {
      throw new CommentNotFoundError();
    }

    return wishList;
  });
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
  return this.find({ 'gifts._id': giftId })
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

wishListSchema.statics.createDib = function (attributes, userId) {
  const giftId = attributes.giftId;
  const raw = true;

  return this.findAuthorizedByGiftId(giftId, userId, raw)
    .then((wishList) => {
      if (wishList._user._id.toString() === userId.toString()) {
        throw new DibValidationError(
          'You cannot dib your own gift.'
        );
      }

      const gift = wishList.gifts.id(giftId);
      if (gift.isReceived) {
        throw new DibValidationError(
          'You cannot dib a gift that has been marked received.'
        );
      }

      const foundDib = gift.dibs.find((dib) => {
        return (dib._user._id.toString() === userId.toString());
      });

      if (foundDib) {
        throw new DibValidationError(
          'You have already dibbed that gift.'
        );
      }

      return validateDibQuantity(gift, attributes.quantity)
        .then(() => wishList);
    })
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      gift.dibs.push({
        _user: userId,
        quantity: attributes.quantity
      });

      return wishList.save();
    })
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);
      const dibId = gift.dibs[gift.dibs.length - 1]._id;

      return dibId;
    });
};

wishListSchema.statics.removeDibById = function (
  dibId,
  userId
) {
  return this.find({ 'gifts.dibs._id': dibId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      return confirmDibUserOwnership(wishList, dibId, userId)
        .then((dib) => {
          dib.remove();
          return wishList.save();
        });
    });
};

wishListSchema.statics.updateDibById = function (
  dibId,
  userId,
  attributes
) {
  return this.find({ 'gifts.dibs._id': dibId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      return confirmDibUserOwnership(wishList, dibId, userId)
        .then((dib) => {
          const gift = wishList.gifts.find((gift) => {
            return (gift.dibs.id(dibId));
          });

          if (gift.isReceived) {
            throw new DibValidationError(
              'You cannot dib a gift that has been marked received.'
            );
          }

          return validateDibQuantity(gift, attributes.quantity, dibId)
            .then(() => {
              dib.updateSync(attributes);
              return wishList.save();
            });
        });
    });
};

wishListSchema.statics.removeCommentById = function (
  commentId,
  userId
) {
  return this.find({ 'gifts.comments._id': commentId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      return confirmCommentUserOwnership(wishList, commentId, userId)
        .then((dib) => {
          dib.remove();
          return wishList.save();
        });
    });
};

wishListSchema.statics.createComment = function (attributes, userId) {
  const giftId = attributes.giftId;
  const raw = true;

  return this.findAuthorizedByGiftId(giftId, userId, raw)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      gift.comments.push({
        _user: userId,
        body: attributes.body
      });

      return wishList.save();
    })
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);
      const commentId = gift.comments[gift.comments.length - 1]._id;

      return commentId;
    });
};

wishListSchema.statics.updateCommentById = function (
  commentId,
  userId,
  attributes
) {
  return this.find({ 'gifts.comments._id': commentId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      return confirmCommentUserOwnership(wishList, commentId, userId)
        .then((comment) => {
          comment.updateSync(attributes);
          return wishList.save();
        });
    });
};

wishListSchema.statics.getCommentsByGiftId = function (giftId, userId) {
  const raw = false;

  return this.findAuthorizedByGiftId(giftId, userId, raw)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      return gift.comments;
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

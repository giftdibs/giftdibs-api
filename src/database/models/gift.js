const mongoose = require('mongoose');

const {
  updateDocument
} = require('../utils/update-document');

const {
  externalUrlSchema
} = require('./external-url');

const {
  dibSchema,
  formatDibResponse
} = require('./dib');

const {
  WishList
} = require('./wish-list');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  DibNotFoundError,
  DibPermissionError
} = require('../../shared/errors');

const {
  GiftNotFoundError,
  GiftPermissionError
} = require('../../shared/errors');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  budget: {
    type: Number,
    min: [0, 'The gift\'s budget must greater than zero.'],
    max: [
      1000000000000,
      'The gift\'s budget must be less than 1,000,000,000,000.'
    ]
  },
  dibs: [
    dibSchema
  ],
  externalUrls: [
    externalUrlSchema
  ],
  isReceived: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  quantity: {
    type: Number,
    min: [1, 'The gift\'s quantity must be greater than zero.'],
    max: [
      1000000000000,
      'The gift\'s quantity must be less than 1,000,000,000,000.'
    ],
    default: 1
  },
  priority: {
    type: Number,
    min: [0, 'The gift\'s priority must be greater than zero.'],
    max: [10, 'The gift\'s priority must be less than 10.'],
    default: 5
  }
}, {
  collection: 'gift',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

function confirmUserOwnership(giftId, userId) {
  const giftModel = this;

  return WishList
    .find({
      _gifts: giftId
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new GiftNotFoundError());
      }

      if (userId.toString() !== wishList._user.toString()) {
        return Promise.reject(new GiftPermissionError());
      }

      return giftModel.find({ _id: giftId }).limit(1);
    })
    .then((docs) => {
      return Promise.resolve(docs[0]);
    });
}

function findByDibId(dibId, userId) {
  return Gift
    .find({
      'dibs._id': dibId
    })
    .limit(1)
    .then((gifts) => {
      const gift = gifts[0];

      if (!gift) {
        throw new DibNotFoundError();
      }

      // Make sure the session user owns the dib.
      const dib = gift.dibs.id(dibId);
      if (dib._user.toString() !== userId.toString()) {
        throw new DibPermissionError();
      }

      return gift;
    });
}

function moveToWishList(wishListId, userId) {
  const instance = this;

  return WishList
    .findAuthorized(
      userId,
      {
        $or: [
          { _id: wishListId },
          { _gifts: instance._id }
        ]
      },
      true
    )
    .then((wishLists) => {
      // The gift already belongs to the wish list.
      if (wishLists.length === 1) {
        return {
          gift: instance
        };
      }

      wishLists.forEach((wishList) => {
        const found = wishList._gifts.find((giftId) => {
          return (giftId.toString() === instance._id.toString());
        });

        if (found) {
          wishList._gifts.remove(instance._id);
        } else {
          wishList._gifts.push(instance._id);
        }
      });

      // Save wish lists and return the updated documents IDs.
      return Promise
        .all([
          wishLists[0].save(),
          wishLists[1].save()
        ])
        .then((results) => {
          return {
            gift: instance,
            wishListIds: results.map((wishList) => wishList._id)
          };
        });
    });
}

function formatGiftResponse(gift, wishList, userId) {
  gift.wishListId = wishList._id;
  gift.user = wishList.user;

  // Remove dibs if session user is owner of gift.
  const isGiftOwner = (wishList.user._id.toString() === userId.toString());
  if (isGiftOwner) {
    gift.dibs = [];
  }

  if (gift.dibs) {
    gift.dibs = gift.dibs.map((dib) => formatDibResponse(dib, userId));
  }

  return gift;
}

giftSchema.statics.findAuthorizedById = function (giftId, userId) {
  let wishList;

  return WishList
    .findAuthorizedByGiftId(giftId, userId)
    .then((_wishList) => {
      wishList = _wishList;

      return Gift
        .find({ _id: giftId })
        .limit(1)
        .populate('dibs._user', 'firstName lastName')
        .lean();
    })
    .then((docs) => {
      let gift = docs[0];
      return formatGiftResponse(gift, wishList, userId);
    });
};

giftSchema.statics.findByDibId = findByDibId;
giftSchema.statics.confirmUserOwnership = confirmUserOwnership;
giftSchema.methods.moveToWishList = moveToWishList;

giftSchema.methods.updateSync = function (values) {
  const instance = this;
  const fields = [
    'budget',
    'isReceived',
    'name',
    'priority',
    'quantity'
  ];

  if (!values.quantity) {
    values.quantity = 1;
  }

  updateDocument(instance, fields, values);

  return instance;
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

giftSchema.pre('validate', function (next) {
  if (this.name) {
    // Replace newline characters.
    this.name = this.name.replace(/\r?\n/g, ' ');
  }

  next();
});

giftSchema.post('remove', function (doc, next) {
  // Remove gift ID from consuming wish list.
  WishList.find({
    _gifts: doc._id
  })
    .limit(1)
    .then((wishLists) => {
      const wishList = wishLists[0];
      wishList._gifts.remove(doc._id);
      return wishList.save();
    })
    .then(() => next())
    .catch(next);
});

const Gift = mongoose.model('Gift', giftSchema);

module.exports = {
  formatGiftResponse,
  Gift,
  giftSchema
};

const mongoose = require('mongoose');

const { externalUrlSchema } = require('./external-url');
const { updateDocument } = require('../utils/update-document');

const {
  dibSchema
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

// giftSchema.statics.findAuthorizedById = function (giftId, userId) {
//   // Running this method will automatically check the gift's privacy,
//   // and if the user has access to retrieve.
//   return WishList
//     .findAuthorizedByGiftId(giftId, userId)
//     .then((wishList) => {
//       return this.find({ _id: giftId }).limit(1).then((docs) => {
//         const gift = docs[0].toObject();
//         gift.wishListId = wishList._id;
//         gift.user = wishList._user;
//         return gift;
//       });
//     });
// };

giftSchema.statics.findByDibId = function (dibId, userId) {
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
};

giftSchema.statics.confirmUserOwnership = function (giftId, userId) {
  // Running this method will automatically check the gift's privacy,
  // and if the user has access to modify.
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

      return this.find({ _id: giftId }).limit(1);
    })
    .then((docs) => {
      return docs[0];
    });
};

giftSchema.methods.updateSync = function (values) {
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

  updateDocument(this, fields, values);

  return this;
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

// TODO: Check all of these methods to make sure we're updating everything!
function removeReferencedDocuments(doc, next) {
  const { Dib } = require('./dib');

  Dib
    .find({ _gift: doc._id })
    .then((dibs) => {
      dibs.forEach((dib) => dib.remove());
      next();
    })
    .catch(next);
}

giftSchema.post('remove', removeReferencedDocuments);

// Replace newline characters.
giftSchema.pre('validate', function (next) {
  if (this.name) {
    this.name = this.name.replace(/\r?\n/g, ' ');
  }

  next();
});

const Gift = mongoose.model('Gift', giftSchema);

module.exports = {
  Gift,
  giftSchema,
  removeReferencedDocuments
};

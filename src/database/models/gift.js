const mongoose = require('mongoose');

const { externalUrlSchema } = require('./external-url');
const { updateDocument } = require('../utils/update-document');

const {
  WishList
} = require('./wish-list');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

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

giftSchema.statics.findAuthorizedById = function (giftId, userId) {
  // Running this method will automatically check the gift's privacy,
  // and if the user has access to modify.
  return WishList
    .findAuthorizedByGiftId(giftId, userId)
    .then(() => {
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

  updateDocument(this, fields, values);

  return this;
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

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

const Gift = mongoose.model('Gift', giftSchema);

module.exports = {
  Gift,
  giftSchema,
  removeReferencedDocuments
};

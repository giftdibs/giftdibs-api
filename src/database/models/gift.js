const mongoose = require('mongoose');
const { externalUrlSchema } = require('./external-url');
const { updateDocument } = require('../utils/update-document');

const {
  GiftNotFoundError,
  GiftPermissionError,
  GiftValidationError
} = require('../../shared/errors');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  _wishList: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'WishList',
    required: [true, 'A wish list ID must be provided.']
  },
  budget: {
    type: Number,
    min: [0, 'The gift\'s budget must greater than zero.'],
    max: [
      1000000000000,
      'The gift\'s budget must be less than 1,000,000,000,000.'
    ]
  },
  externalUrls: [externalUrlSchema],
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
  orderInWishList: {
    type: Number,
    min: [0, 'The gift\'s order must be greater than zero.']
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

giftSchema.methods.updateSync = function (values) {
  const fields = [
    '_wishList',
    'budget',
    'isReceived',
    'name',
    'orderInWishList',
    'priority',
    'quantity'
  ];

  updateDocument(this, fields, values);

  return this;
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);
giftSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new GiftValidationError('Please provide a gift ID.'),
    notFound: new GiftNotFoundError(),
    permission: new GiftPermissionError()
  }
});

const Gift = mongoose.model('Gift', giftSchema);

module.exports = { Gift };

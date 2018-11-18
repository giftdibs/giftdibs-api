const mongoose = require('mongoose');

const {
  updateDocument
} = require('../utils/update-document');

const {
  externalUrlSchema
} = require('./external-url');

const {
  commentSchema
} = require('./comment');

const {
  dibSchema
} = require('./dib');

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
  comments: [
    commentSchema
  ],
  dateReceived: Date,
  dibs: [
    dibSchema
  ],
  externalUrls: [
    externalUrlSchema
  ],
  imageUrl: String,
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [
      2000,
      'Notes cannot be longer than 2000 characters.'
    ]
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
    min: [1, 'The gift\'s priority must be greater than zero.'],
    max: [5, 'The gift\'s priority must be less than or equal to 5.'],
    default: 3
  }
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

giftSchema.methods.moveToWishList = function (wishListId, userId) {
  const instance = this;
  const doReturnMongooseObject = true;
  const { WishList } = require('./wish-list');

  return WishList.findAuthorized(
    userId,
    {
      $or: [
        { _id: wishListId },
        { 'gifts._id': instance._id }
      ]
    },
    doReturnMongooseObject
  ).then((wishLists) => {
    // The gift already belongs to the wish list.
    // (The query attempts to find the gift's current wish list
    // and the move-to wish list. If the wish list IDs match,
    // do nothing.)
    if (wishLists.length === 1) {
      return {
        gift: instance
      };
    }

    wishLists.forEach((wishList) => {
      const found = wishList.gifts.id(instance._id);

      if (found) {
        wishList.gifts.remove(instance);
      } else {
        wishList.gifts.push(instance);
      }
    });

    // Save wish lists and return the updated documents IDs.
    return Promise.all([
      wishLists[0].save(),
      wishLists[1].save()
    ]).then((results) => {
      return {
        gift: instance,
        wishListIds: results.map((wishList) => wishList._id)
      };
    });
  });
};

giftSchema.methods.updateSync = function (values) {
  const instance = this;
  const fields = [
    'budget',
    'externalUrls',
    'name',
    'notes',
    'priority',
    'quantity'
  ];

  if (!values.quantity) {
    values.quantity = 1;
  }

  if (values.name) {
    // Replace newline characters.
    // TODO: Move this to a pre validate hook?
    values.name = values.name.replace(/\r?\n/g, ' ');
  }

  if (values.budget) {
    values.budget = Math.round(values.budget);
  }

  updateDocument(instance, fields, values);

  return instance;
};

module.exports = {
  giftSchema
};

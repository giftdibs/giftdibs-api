const mongoose = require('mongoose');
const externalUrlSchema = require('./external-url');
const WishList = require('./wish-list');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { GiftNotFoundError } = require('../../shared/errors');
const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  budget: {
    type: Number,
    maxlength: [13, 'The gift\'s budget must be less than 1,000,000,000,000.']
  },
  externalUrls: [externalUrlSchema]
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

giftSchema.methods.update = function (values) {
  const fields = ['name', 'budget'];
  updateDocument(this, fields, values);
};

giftSchema.statics.getById = function (wishListId, giftId) {
  return WishList
    .getById(wishListId)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      if (!gift) {
        return Promise.reject(new GiftNotFoundError());
      }

      return {
        gift, wishList
      };
    });
};

giftSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = giftSchema;

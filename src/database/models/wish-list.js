const mongoose = require('mongoose');
const giftSchema = require('./gift');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');
const { WishListNotFoundError, GiftNotFoundError } = require('../../shared/errors');

const Schema = mongoose.Schema;
const wishListSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  gifts: [giftSchema],
  name: {
    type: String,
    required: [true, 'Please provide a wish list name.'],
    trim: true,
    maxlength: [100, 'The wish list\'s name cannot be longer than 100 characters.']
  }
}, {
  collection: 'WishList',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

wishListSchema.methods.update = function (values) {
  const fields = ['name'];
  updateDocument(this, fields, values);
};

wishListSchema.statics.getById = function (wishListId) {
  return this.find({ _id: wishListId })
    .limit(1)
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        return Promise.reject(new WishListNotFoundError());
      }

      return wishList;
    });
};

wishListSchema.statics.getGiftById = function (wishListId, giftId) {
  return this.getById(wishListId)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      if (!gift) {
        return Promise.reject(new GiftNotFoundError());
      }

      return {
        wishList, gift
      };
    });
};

wishListSchema.plugin(MongoDbErrorHandlerPlugin);

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;

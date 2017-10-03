const mongoose = require('mongoose');
const { MongoDbErrorHandlerPlugin } = require('../plugins/mongodb-error-handler');
const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const dibSchema = new Schema({
  _gift: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Gift',
    required: [true, 'A gift ID must be provided.']
  },
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  dateDelivered: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  pricePaid: {
    type: Number,
    min: [0, 'The price paid must be more than zero.'],
    max: [1000000000000, 'The price paid must be less than 1,000,000,000,000.']
  }
}, {
  collection: 'Dib',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

dibSchema.methods.update = function (values) {
  const fields = ['_user', '_gift', 'dateDelivered', 'isDelivered', 'pricePaid'];
  updateDocument(this, fields, values);
};

dibSchema.plugin(MongoDbErrorHandlerPlugin);

const Dib = mongoose.model('Dib', dibSchema);

module.exports = Dib;

const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin,
} = require('../plugins/mongodb-error-handler');

const { updateDocument } = require('../utils/update-document');

const Schema = mongoose.Schema;
const dibSchema = new Schema(
  {
    _user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'A user ID must be provided.'],
    },
    dateDelivered: Date,
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot be longer than 2000 characters.'],
    },
    pricePaid: {
      type: Number,
      min: [0, 'The price paid must be at least zero.'],
      max: [
        1000000000000,
        'The price paid must be less than 1,000,000,000,000.',
      ],
    },
    quantity: {
      required: [true, "The dib's quantity must be provided."],
      type: Number,
      min: [1, "The dib's quantity must be at least 1."],
      max: [
        1000000000000,
        "The dib's quantity must be less than 1,000,000,000,000.",
      ],
    },
  },
  {
    timestamps: {
      createdAt: 'dateCreated',
      updatedAt: 'dateUpdated',
    },
  }
);

dibSchema.methods.updateSync = function (values) {
  const fields = ['isAnonymous', 'notes', 'pricePaid', 'quantity'];

  // Default quantity to 1.
  if (!values.quantity) {
    values.quantity = 1;
  }

  updateDocument(this, fields, values);

  return this;
};

dibSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = {
  dibSchema,
};

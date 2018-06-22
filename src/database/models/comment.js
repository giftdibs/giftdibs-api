const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  updateDocument
} = require('../utils/update-document');

const Schema = mongoose.Schema;
const commentSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  body: {
    type: String,
    trim: true,
    maxlength: [
      2001,
      'Comments cannot be longer than 2000 characters.'
    ]
  }
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

commentSchema.methods.updateSync = function (values) {
  const fields = [
    'body'
  ];

  updateDocument(this, fields, values);

  return this;
};

commentSchema.plugin(MongoDbErrorHandlerPlugin);

module.exports = {
  commentSchema
};

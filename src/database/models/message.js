const mongoose = require('mongoose');

const {
  MessageNotFoundError,
  MessagePermissionError,
  MessageValidationError
} = require('../../shared/errors');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  updateDocument
} = require('../utils/update-document');

const Schema = mongoose.Schema;
const messageSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  },
  body: {
    type: String,
    trim: true,
    maxlength: [
      2000,
      'Messages cannot be longer than 2000 characters.'
    ]
  },
  replies: [
    {
      _user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: [true, 'A user ID must be provided.']
      },
      body: {
        type: String,
        trim: true,
        maxlength: [
          2000,
          'Messages cannot be longer than 2000 characters.'
        ]
      }
    }
  ]
}, {
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

messageSchema.methods.updateSync = function (values) {
  const fields = [
    'body'
  ];

  updateDocument(this, fields, values);

  return this;
};

messageSchema.plugin(MongoDbErrorHandlerPlugin);

messageSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new MessageValidationError('Please provide a message ID.'),
    notFound: new MessageNotFoundError(),
    permission: new MessagePermissionError()
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message
};

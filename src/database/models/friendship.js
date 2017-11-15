const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

const {
  FriendshipNotFoundError,
  FriendshipPermissionError,
  FriendshipValidationError
} = require('../../shared/errors');

const Schema = mongoose.Schema;
const friendshipSchema = new Schema({
  _friend: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A friend ID must be provided.']
  },
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [true, 'A user ID must be provided.']
  }
}, {
  collection: 'friendship',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

friendshipSchema.plugin(MongoDbErrorHandlerPlugin);
friendshipSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new FriendshipValidationError('Please provide a friendship ID.'),
    notFound: new FriendshipNotFoundError(),
    permission: new FriendshipPermissionError()
  }
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = { Friendship };

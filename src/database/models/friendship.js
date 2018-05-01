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

friendshipSchema.statics.getFriendshipsByUserId = function (userId) {
  const query = {};

  if (!userId) {
    return new FriendshipValidationError(
      'Please provide a user ID.'
    );
  }

  query.$or = [{
    _user: userId
  }, {
    _friend: userId
  }];

  return this.find(query)
    .populate('_friend', 'firstName lastName')
    .populate('_user', 'firstName lastName')
    .lean();
};

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

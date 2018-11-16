const mongoose = require('mongoose');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  FriendshipNotFoundError,
  FriendshipValidationError
} = require('../../shared/errors');

const {
  Notification
} = require('./notification');

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

friendshipSchema.statics.create = function (friendId, sessionUser) {
  const userId = sessionUser._id;

  if (userId.toString() === friendId) {
    return Promise.reject(
      new FriendshipValidationError(
        'You cannot follow yourself.'
      )
    );
  }

  if (!friendId) {
    return Promise.reject(
      new FriendshipValidationError(
        'Please provide the user ID of the friend you wish to follow.'
      )
    );
  }

  let _friendship;

  return this.find({
    '_user': userId,
    '_friend': friendId
  })
    .limit(1)
    .lean()
    .then((docs) => {
      const friend = docs[0];

      if (friend) {
        return Promise.reject(
          new FriendshipValidationError(
            'You are already following that person.'
          )
        );
      }

      const friendship = new Friendship({
        _user: userId,
        _friend: friendId
      });

      return friendship.save();
    })
    .then((doc) => {
      _friendship = doc;
      return Notification.notifyNewFriendship(doc._friend, sessionUser);
    })
    .then(() => _friendship);
};

friendshipSchema.statics.getFriendshipsByUserId = function (userId) {
  if (!userId) {
    return Promise.reject(
      new FriendshipValidationError(
        'Please provide a user ID.'
      )
    );
  }

  return Promise.all([
    this.find({ '_user': userId }).populate('_friend', 'firstName lastName avatarUrl').lean(), // following
    this.find({ '_friend': userId }).populate('_user', 'firstName lastName avatarUrl').lean() // followers
  ]).then((result) => {
    return {
      following: result[0].map((friendship) => friendship._friend),
      followers: result[1].map((friendship) => friendship._user)
    };
  });
};

friendshipSchema.statics.confirmUserOwnership = function (friendId, userId) {
  if (!friendId) {
    return Promise.reject(
      new FriendshipValidationError('Please provide a user ID.')
    );
  }

  const model = this;

  return model.find({
    '_friend': friendId,
    '_user': userId
  })
    .limit(1)
    .then((docs) => {
      const doc = docs[0];

      if (!doc) {
        return Promise.reject(
          new FriendshipNotFoundError()
        );
      }

      return doc;
    });
};

friendshipSchema.plugin(MongoDbErrorHandlerPlugin);

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = { Friendship };

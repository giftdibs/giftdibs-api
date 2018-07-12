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
  // TODO: Better to add friendships to the User model?
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

friendshipSchema.statics.create = function (friendId, user) {
  if (user._id.toString() === friendId) {
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

  // TODO: Prevent non-verified accounts from following people!

  return this.find({
    _user: user._id,
    _friend: friendId
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
        _user: user._id,
        _friend: friendId
      });

      return friendship.save();
    })
    .then((doc) => {
      const {
        Notification
      } = require('./notification');

      return Notification.create({
        _user: doc._friend,
        follower: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName
        },
        type: 'friendship_new'
      }).then(() => doc);
    });
};

friendshipSchema.statics.getFriendshipsByUserId = function (userId) {
  const query = {};

  if (!userId) {
    return Promise.reject(
      new FriendshipValidationError(
        'Please provide a user ID.'
      )
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

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
  // Since user information rarely changes,
  // let's denormalize the foreign references, to avoid
  // complex joins later.
  friend: {
    id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'A friend ID must be provided.']
    },
    firstName: String,
    lastName: String
  },
  user: {
    id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'A user ID must be provided.']
    },
    firstName: String,
    lastName: String
  }
}, {
  collection: 'friendship',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

friendshipSchema.statics.create = function (friendId, userId) {
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

  // TODO: Prevent non-verified accounts from following people?

  return this.find({
    'user.id': userId,
    'friend.id': friendId
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

      const { User } = require('./user');

      // Fetch both friend and user data.
      return Promise.all([
        User.find({ _id: userId }).limit(1).lean(),
        User.find({ _id: friendId }).limit(1).lean()
      ]);
    })
    .then((result) => {
      const friendship = new Friendship({
        user: {
          id: result[0]._id,
          firstName: result[0].firstName,
          lastName: result[0].lastName
        },
        friend: {
          id: result[1]._id,
          firstName: result[1].firstName,
          lastName: result[1].lastName
        }
      });

      return friendship.save();
    })
    .then((doc) => {
      const {
        Notification
      } = require('./notification');

      return Notification.create({
        type: 'friendship_new',
        _user: doc.friend.id,
        follower: {
          id: doc.user._id,
          firstName: doc.user.firstName,
          lastName: doc.user.lastName
        }
      }).then(() => doc);
    });
};

friendshipSchema.statics.getFriendshipsByUserId = function (userId) {
  if (!userId) {
    return Promise.reject(
      new FriendshipValidationError(
        'Please provide a user ID.'
      )
    );
  }

  const query = {
    $or: [
      {
        'user.id': userId
      },
      {
        'friend.id': userId
      }
    ]
  };

  return this.find(query).lean();
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

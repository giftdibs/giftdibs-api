const mongoose = require('mongoose');

const {
  NotificationNotFoundError,
  NotificationPermissionError,
  NotificationValidationError,
} = require('../../shared/errors');

const mailer = require('../../shared/mailer');

const {
  ConfirmUserOwnershipPlugin,
} = require('../plugins/confirm-user-ownership');

const {
  MongoDbErrorHandlerPlugin,
} = require('../plugins/mongodb-error-handler');

const { updateDocument } = require('../utils/update-document');

const userSubSchema = {
  id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
  },
  firstName: String,
  lastName: String,
};

const Schema = mongoose.Schema;
const notificationSchema = new Schema(
  {
    _user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: [true, 'A user ID must be provided.'],
    },
    type: {
      type: String,
      enum: [
        'gift_comment',
        'gift_comment_also',
        'gift_delivered',
        'gift_received',
        'friendship_new',
      ],
      required: [true, 'A notification type must be provided.'],
    },
    // Since notifications are simply read and deleted,
    // let's denormalize the foreign references, to avoid
    // complex joins later.
    follower: userSubSchema,
    dib: {
      id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'WishList.gifts.dibs',
      },
      dateDelivered: Date,
    },
    gift: {
      id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'WishList.gifts',
      },
      name: String,
      user: userSubSchema,
      comment: {
        user: userSubSchema,
        summary: String,
      },
      dibs: [
        {
          isAnonymous: Boolean,
          user: userSubSchema,
        },
      ],
    },
  },
  {
    collection: 'notification',
    timestamps: {
      createdAt: 'dateCreated',
      updatedAt: 'dateUpdated',
    },
  }
);

function createNotification(args) {
  const notification = new Notification(args);

  return notification.save();
}

function truncateText(text, length) {
  if (!text) {
    return text;
  }

  if (text.length <= length) {
    return text;
  }

  return text.substr(0, length) + '\u2026';
}

function fetchRecipient(recipientId) {
  const { User } = require('./user');

  return User.find({ _id: recipientId })
    .select('emailAddress emailAddressVerified firstName notificationSettings')
    .limit(1)
    .lean()
    .then((recipients) => {
      return recipients[0];
    });
}

function requestsEmail(recipient, type) {
  return (
    recipient.emailAddressVerified === true &&
    recipient.notificationSettings &&
    recipient.notificationSettings[type].allowEmail === true
  );
}

function notifyNewFriendship(recipientId, sessionUser) {
  const type = 'friendship_new';

  return fetchRecipient(recipientId).then((recipient) => {
    return createNotification({
      type,
      _user: recipient._id,
      follower: {
        id: sessionUser._id,
        firstName: sessionUser.firstName,
        lastName: sessionUser.lastName,
      },
    }).then((doc) => {
      if (!requestsEmail(recipient, type)) {
        return doc;
      }

      const html = `
<p>
Hi, ${recipient.firstName}!
</p>
<p>
<a href="https://giftdibs.com/users/${sessionUser._id}">${sessionUser.firstName} ${sessionUser.lastName}</a> is now following you on GiftDibs!
</p>
`;

      return mailer
        .sendEmail(
          recipient.emailAddress,
          [
            `${sessionUser.firstName} ${sessionUser.lastName}`,
            'has started following you',
          ].join(' '),
          html
        )
        .then(() => doc);
    });
  });
}

function notifyGiftComment(recipientId, sessionUser, gift, comment) {
  const type = 'gift_comment';

  return fetchRecipient(recipientId).then((recipient) => {
    return createNotification({
      _user: recipient._id,
      gift: {
        id: gift._id,
        name: gift.name,
        comment: {
          id: comment._id,
          user: {
            id: sessionUser._id,
            firstName: sessionUser.firstName,
            lastName: sessionUser.lastName,
          },
          summary: truncateText(comment.body, 50),
        },
      },
      type,
    }).then((doc) => {
      if (!requestsEmail(recipient, type)) {
        return doc;
      }

      const html = `
<p>
Hi, ${recipient.firstName}!
</p>
<p>
<a href="https://giftdibs.com/users/${sessionUser._id}">${sessionUser.firstName} ${sessionUser.lastName}</a> commented on <a href="https://giftdibs.com/gifts/${gift._id}">${gift.name}</a>:
</p>
<p>
"${comment.body}"
</p>
`;

      return mailer
        .sendEmail(
          recipient.emailAddress,
          [
            `${sessionUser.firstName} ${sessionUser.lastName}`,
            `commented on ${gift.name}`,
          ].join(' '),
          html
        )
        .then(() => doc);
    });
  });
}

function notifyGiftCommentAlso(recipientId, sessionUser, gift, comment) {
  const type = 'gift_comment_also';

  return fetchRecipient(recipientId).then((recipient) => {
    return createNotification({
      _user: recipient._id,
      gift: {
        id: gift._id,
        name: gift.name,
        comment: {
          id: comment._id,
          user: {
            id: sessionUser._id,
            firstName: sessionUser.firstName,
            lastName: sessionUser.lastName,
          },
          summary: truncateText(comment.body, 50),
        },
      },
      type,
    }).then((doc) => {
      if (!requestsEmail(recipient, type)) {
        return doc;
      }

      const html = `
<p>
Hi, ${recipient.firstName}!
</p>
<p>
<a href="https://giftdibs.com/users/${sessionUser._id}">${sessionUser.firstName} ${sessionUser.lastName}</a> also commented on <a href="https://giftdibs.com/gifts/${gift._id}">${gift.name}</a>:
</p>
<p>
"${comment.body}"
</p>
`;

      return mailer
        .sendEmail(
          recipient.emailAddress,
          [
            `${sessionUser.firstName} ${sessionUser.lastName}`,
            `also commented on ${gift.name}`,
          ].join(' '),
          html
        )
        .then(() => doc);
    });
  });
}

function notifyGiftReceived(recipientId, sessionUser, gift, dib) {
  const type = 'gift_received';

  return fetchRecipient(recipientId).then((recipient) => {
    return createNotification({
      type,
      _user: dib._user,
      dib: {
        id: dib._id,
        dateDelivered: dib.dateDelivered,
      },
      gift: {
        id: gift.id,
        name: gift.name,
        user: {
          id: sessionUser._id,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
        },
      },
    }).then((doc) => {
      if (!requestsEmail(recipient, type)) {
        return doc;
      }

      const html = `
<p>
Hi, ${recipient.firstName}!
</p>
<p>
<a href="https://giftdibs.com/users/${sessionUser._id}">${sessionUser.firstName} ${sessionUser.lastName}</a> marked their gift <a href="https://giftdibs.com/gifts/${gift._id}">${gift.name}</a> as received.
</p>
`;

      return mailer
        .sendEmail(
          recipient.emailAddress,
          [
            `${sessionUser.firstName} ${sessionUser.lastName}`,
            `marked their gift ${gift.name} as received`,
          ].join(' '),
          html
        )
        .then(() => doc);
    });
  });
}

function notifyGiftDelivered(recipientId, sessionUser, gift, dibs) {
  const type = 'gift_delivered';

  return fetchRecipient(recipientId).then((recipient) => {
    return createNotification({
      type,
      _user: recipientId,
      gift: {
        id: gift.id,
        name: gift.name,
        dibs,
      },
    }).then((doc) => {
      if (!requestsEmail(recipient, type)) {
        return doc;
      }

      const html = `
<p>
Hi, ${recipient.firstName}!
</p>
<p>
<a href="https://giftdibs.com/users/${sessionUser._id}">${sessionUser.firstName} ${sessionUser.lastName}</a> marked your gift <a href="https://giftdibs.com/gifts/${gift._id}">${gift.name}</a> as delivered.
</p>
`;

      return mailer
        .sendEmail(
          recipient.emailAddress,
          [
            `${sessionUser.firstName} ${sessionUser.lastName}`,
            `marked your gift ${gift.name} as delivered`,
          ].join(' '),
          html
        )
        .then(() => doc);
    });
  });
}

notificationSchema.statics.notifyNewFriendship = notifyNewFriendship;

notificationSchema.statics.notifyGiftComment = notifyGiftComment;

notificationSchema.statics.notifyGiftCommentAlso = notifyGiftCommentAlso;

notificationSchema.statics.notifyGiftReceived = notifyGiftReceived;

notificationSchema.statics.notifyGiftDelivered = notifyGiftDelivered;

notificationSchema.methods.updateSync = function (values) {
  const fields = [];

  updateDocument(this, fields, values);

  return this;
};

notificationSchema.plugin(MongoDbErrorHandlerPlugin);

notificationSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new NotificationValidationError(
      'Please provide a notification ID.'
    ),
    notFound: new NotificationNotFoundError(),
    permission: new NotificationPermissionError(),
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification,
};

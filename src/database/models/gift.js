const mongoose = require('mongoose');

const {
  ConfirmUserOwnershipPlugin
} = require('../plugins/confirm-user-ownership');

const {
  MongoDbErrorHandlerPlugin
} = require('../plugins/mongodb-error-handler');

const {
  CommentNotFoundError,
  CommentPermissionError,
  DibNotFoundError,
  DibPermissionError,
  DibValidationError,
  GiftNotFoundError,
  GiftPermissionError,
  GiftValidationError
} = require('../../shared/errors');

const {
  updateDocument
} = require('../utils/update-document');

const {
  externalUrlSchema
} = require('./external-url');

const {
  commentSchema
} = require('./comment');

const {
  dibSchema
} = require('./dib');

const Schema = mongoose.Schema;
const giftSchema = new Schema({
  _user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: [
      true,
      'A user ID must be provided.'
    ]
  },
  _wishList: {
    ref: 'WishList',
    type: mongoose.SchemaTypes.ObjectId
  },
  budget: {
    type: Number,
    min: [0, 'The gift\'s budget must greater than zero.'],
    max: [
      1000000000000,
      'The gift\'s budget must be less than 1,000,000,000,000.'
    ]
  },
  comments: [
    commentSchema
  ],
  dateReceived: Date,
  dibs: [
    dibSchema
  ],
  externalUrls: [
    externalUrlSchema
  ],
  imageUrl: String,
  name: {
    type: String,
    required: [true, 'Please provide a gift name.'],
    trim: true,
    maxlength: [250, 'The gift\'s name cannot be longer than 250 characters.']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [
      2000,
      'Notes cannot be longer than 2000 characters.'
    ]
  },
  quantity: {
    type: Number,
    min: [1, 'The gift\'s quantity must be greater than zero.'],
    max: [
      1000000000000,
      'The gift\'s quantity must be less than 1,000,000,000,000.'
    ],
    default: 1
  },
  priority: {
    type: Number,
    min: [1, 'The gift\'s priority must be greater than zero.'],
    max: [5, 'The gift\'s priority must be less than or equal to 5.'],
    default: 3
  }
}, {
  collection: 'gift',
  timestamps: {
    createdAt: 'dateCreated',
    updatedAt: 'dateUpdated'
  }
});

// #region dibs
function validateDibQuantity(gift, quantity = 1, dibId) {
  let totalDibs = quantity;

  return new Promise((resolve, reject) => {
    gift.dibs.forEach((dib) => {
      // Don't count the quantity of a dib that's being updated.
      if (dibId === dib._id.toString()) {
        return;
      }

      totalDibs += parseInt(dib.quantity, 10);
    });

    if (totalDibs > gift.quantity) {
      const err = new DibValidationError();

      err.errors = [{
        message: [
          'Dib quantity is more than are available.',
          'Please choose a smaller amount.'
        ].join(' '),
        field: 'quantity'
      }];

      reject(err);
      return;
    }

    resolve(gift);
  });
}

// Do not update the date when modifying dibs.
async function revertDateUpdated(giftId, dateUpdated) {
  // Running the update command from the model does not trigger plugins.
  await Gift.update(
    { _id: giftId },
    { dateUpdated: dateUpdated }
  );
}

function confirmDibUserOwnershipSync(gift, dibId, userId) {
  const dib = gift.dibs.id(dibId);

  if (!dib) {
    throw new DibNotFoundError();
  }

  if (userId.toString() !== dib._user._id.toString()) {
    throw new DibPermissionError();
  }

  return dib;
}

async function createDib(giftId, attributes, userId) {
  const {
    WishList
  } = require('./wish-list');

  const gifts = await Gift.find({ '_id': giftId }).limit(1);
  const gift = gifts[0];
  if (!gift) {
    throw new GiftNotFoundError();
  }

  if (gift._user.toString() === userId.toString()) {
    throw new DibValidationError(
      'You cannot dib your own gift.'
    );
  }

  if (gift.dateReceived) {
    throw new DibValidationError(
      'You cannot dib a gift that has been marked received.'
    );
  }

  const foundDib = gift.dibs.find((dib) => {
    return (dib._user.toString() === userId.toString());
  });

  if (foundDib) {
    throw new DibValidationError(
      'You have already dibbed that gift.'
    );
  }

  await validateDibQuantity(gift, attributes.quantity);

  const wishLists = await WishList.findAuthorized(userId, {
    '_id': gift._wishList
  })
    .limit(1)
    .select('_id');

  const wishList = wishLists[0];

  if (!wishList) {
    throw new DibValidationError(
      'You do not have permission to dib that gift.'
    );
  }

  gift.dibs.push({
    _user: userId,
    isAnonymous: attributes.isAnonymous,
    quantity: attributes.quantity
  });

  const oldDateUpdated = gift.dateUpdated;

  const doc = await gift.save();

  await revertDateUpdated(giftId, oldDateUpdated);

  const dibId = doc.dibs[doc.dibs.length - 1]._id;

  return dibId;
}

async function markDibAsDelivered(dibId, user) {
  const userId = user._id;

  const gifts = await this.find({
    'dibs._id': dibId
  })
    .limit(1)
    .select([
      '_user',
      'dibs',
      'name',
      'quantity'
    ].join(' '))
    .populate('dibs._user', 'firstName lastName');

  const gift = gifts[0];
  if (!gift) {
    throw new DibNotFoundError();
  }

  const dib = confirmDibUserOwnershipSync(gift, dibId, userId);

  if (dib.dateDelivered) {
    return;
  }

  dib.set('dateDelivered', new Date());

  await gift.save();

  // If gift quantity is greater than 1 and all other
  // dibs are delivered, send notification and email to gift
  // owner to mark gift as received.
  let sendNotification = false;
  if (gift.quantity === 1) {
    sendNotification = true;
  } else {
    let numDibbed = 0;
    gift.dibs.forEach((dib) => {
      numDibbed += dib.quantity;
    });

    if (numDibbed >= gift.quantity) {
      sendNotification = true;
    }
  }

  if (!sendNotification) {
    return;
  }

  const {
    Notification
  } = require('./notification');

  const dibs = gift.dibs.map((dib) => {
    const result = {
      user: {
        firstName: '',
        lastName: ''
      },
      isAnonymous: !!dib.isAnonymous
    };

    if (!dib.isAnonymous) {
      result.user.id = dib._user._id;
      result.user.firstName = dib._user.firstName;
      result.user.lastName = dib._user.lastName;
    }

    return result;
  });

  await Notification.notifyGiftDelivered(
    gift._user,
    user,
    gift,
    dibs
  );
}

async function updateDibById(dibId, userId, attributes) {
  console.log('updateDibByID:', dibId, userId, attributes);
  const gifts = await this.find({ 'dibs._id': dibId })
    .limit(1);

  const gift = gifts[0];

  if (gift.dateReceived) {
    throw new DibValidationError(
      'You may not modify a dib for a gift that has been marked received.'
    );
  }

  const dib = confirmDibUserOwnershipSync(gift, dibId, userId);

  if (dib.dateDelivered) {
    throw new DibValidationError(
      'You may not modify a dib for a gift that has already been delivered.'
    );
  }

  const oldDateUpdated = gift.dateUpdated;

  await validateDibQuantity(gift, attributes.quantity, dibId);

  dib.updateSync(attributes);

  await gift.save();

  await revertDateUpdated(gift._id, oldDateUpdated);
}

async function removeDibById(dibId, userId) {
  const gifts = await this.find({ 'dibs._id': dibId })
    .limit(1);

  const gift = gifts[0];
  const dib = confirmDibUserOwnershipSync(gift, dibId, userId);

  const oldDateUpdated = gift.dateUpdated;

  await dib.remove();
  await gift.save();

  await revertDateUpdated(gift._id, oldDateUpdated);
}
// #endregion

// #region comments
async function getCommentById(commentId, userId) {
  const {
    WishList
  } = require('./wish-list');

  const gifts = await this.find({
    'comments._id': commentId
  })
    .limit(1)
    .select('_wishList comments')
    .populate('comments._user', 'avatarUrl firstName lastName')
    .lean();

  const gift = gifts[0];

  if (!gift) {
    throw new CommentNotFoundError();
  }

  // Verify user has permission to comment.
  const wishLists = await WishList.findAuthorized(userId, {
    '_id': gift._wishList
  })
    .limit(1)
    .select('_id');

  const wishList = wishLists[0];

  if (!wishList) {
    throw new CommentPermissionError();
  }

  const comment = gift.comments.find((c) => {
    return (c._id.toString() === commentId);
  });

  return comment;
}

async function createComment(giftId, attributes, user) {
  const userId = user._id;

  const {
    Notification
  } = require('./notification');

  const {
    WishList
  } = require('./wish-list');

  const gifts = await this.find({ '_id': giftId }).limit(1);
  const gift = gifts[0];

  if (!gift) {
    throw new GiftNotFoundError();
  }

  // Verify user has permission to comment.
  const wishLists = await WishList.findAuthorized(userId, {
    '_id': gift._wishList
  })
    .limit(1)
    .select('_id _user');

  const wishList = wishLists[0];

  if (!wishList) {
    throw new CommentPermissionError();
  }

  gift.comments.push({
    _user: userId,
    body: attributes.body
  });

  const doc = await gift.save();
  const comment = doc.comments[doc.comments.length - 1];
  const ownerId = gift._user.toString();

  // Get a list of all users who have commented on this gift.
  let userIds = doc.comments.map((c) => c._user.toString());

  // Filter out duplicate user IDs.
  userIds = [...new Set(userIds)];

  // Remove ID if it belongs to the commentor, or gift owner.
  userIds = userIds.filter((uId) => {
    return (
      uId !== userId.toString() &&
      uId !== ownerId
    );
  });

  // Send a notification to each user.
  const promises = userIds.map((uId) => {
    return Notification.notifyGiftCommentAlso(
      uId,
      user,
      gift,
      comment
    );
  });

  await Promise.all(promises);

  // Owner of gift always receives a standard notification
  // when someone comments on their gift.
  if (ownerId !== userId.toString()) {
    await Notification.notifyGiftComment(
      wishList._user,
      user,
      gift,
      comment
    );
  }

  return comment._id;
}

async function removeCommentById(commentId, userId) {
  const gifts = await this.find({ 'comments._id': commentId }).limit(1);
  const gift = gifts[0];

  if (!gift) {
    throw new CommentNotFoundError();
  }

  const comment = gift.comments.id(commentId);
  if (comment._user.toString() !== userId.toString()) {
    throw new CommentPermissionError();
  }

  await comment.remove();
  await gift.save();
}

async function updateCommentById(commentId, userId, attributes) {
  const gifts = await this.find({ 'comments._id': commentId }).limit(1);
  const gift = gifts[0];

  if (!gift) {
    throw new CommentNotFoundError();
  }

  const comment = gift.comments.id(commentId);
  if (comment._user.toString() !== userId.toString()) {
    throw new CommentPermissionError();
  }

  comment.updateSync(attributes);

  await gift.save();
}
// #endregion

giftSchema.methods.updateSync = function (values) {
  const instance = this;
  const fields = [
    'budget',
    'externalUrls',
    'name',
    'notes',
    'priority',
    'quantity'
  ];

  if (!values.quantity) {
    values.quantity = 1;
  }

  if (values.name) {
    // Replace newline characters.
    // TODO: Move this to a pre validate hook?
    values.name = values.name.replace(/\r?\n/g, ' ');
  }

  if (values.budget) {
    values.budget = Math.round(values.budget);
  }

  if (values.wishList && values.wishList.id) {
    this.set('_wishList', values.wishList.id);
  }

  updateDocument(instance, fields, values);

  return instance;
};

giftSchema.statics.createDib = createDib;
giftSchema.statics.updateDibById = updateDibById;
giftSchema.statics.removeDibById = removeDibById;
giftSchema.statics.markDibAsDelivered = markDibAsDelivered;

giftSchema.statics.getCommentById = getCommentById;
giftSchema.statics.createComment = createComment;
giftSchema.statics.removeCommentById = removeCommentById;
giftSchema.statics.updateCommentById = updateCommentById;

giftSchema.plugin(MongoDbErrorHandlerPlugin);
giftSchema.plugin(ConfirmUserOwnershipPlugin, {
  errors: {
    validation: new GiftValidationError('Please provide a gift ID.'),
    notFound: new GiftNotFoundError(),
    permission: new GiftPermissionError()
  }
});

giftSchema.post('remove', function (gift, next) {
  const fileHandler = require('../../shared/file-handler');

  if (gift.imageUrl) {
    const fragments = gift.imageUrl.split('/');
    const fileName = fragments[fragments.length - 1];

    fileHandler.remove(fileName)
      .then(() => next())
      .catch(next);

    return;
  }

  next();
});

const Gift = mongoose.model('Gift', giftSchema);

module.exports = {
  // TODO: Remove the schema from exports!
  giftSchema,
  Gift
};

const authResponse = require('../../../middleware/auth-response');

const {
  Gift
} = require('../../../database/models/gift');

const {
  WishList
} = require('../../../database/models/wish-list');

const {
  formatWishListResponse
} = require('../../wish-lists/shared');

function getSumBudget(recipient) {
  let budgeted = 0;
  let pricePaid = 0;

  recipient.wishLists.forEach((wishList) => {
    wishList.gifts.forEach((gift) => {
      budgeted += parseInt(gift.budget, 10) || 0;

      gift.dibs.forEach((dib) => {
        if (dib.pricePaid !== undefined) {
          pricePaid += parseInt(dib.pricePaid, 10);
        }
      });
    });
  });

  recipient.totalBudgeted = budgeted;
  recipient.totalPricePaid = pricePaid;
}

async function getDibsRecipients(req, res, next) {
  const recipients = [];
  const userId = req.user._id;
  const status = req.query.status;

  let giftsQuery = {};

  if (status === 'delivered') {
    giftsQuery = {
      $and: [
        { 'dibs._user': userId },
        { 'dibs.dateDelivered': { $exists: true } }
      ]
    };
  } else {
    giftsQuery = {
      $and: [
        { 'dibs._user': userId },
        { 'dibs.dateDelivered': { $exists: false } }
      ]
    };
  }

  try {
    const gifts = await Gift.find(giftsQuery)
      .select([
        '_user',
        '_wishList',
        'budget',
        'dateReceived',
        'dateUpdated',
        'dibs',
        'imageUrl',
        'name'
      ].join(' '))
      .populate('_user', 'avatarUrl firstName lastName')
      .populate('dibs._user', 'avatarUrl firstName lastName')
      .lean();

    const wishListIds = gifts.map((g) => g._wishList);

    const wishLists = await WishList.find({
      '_id': wishListIds
    })
      .select([
        '_user',
        'name'
      ].join(' '))
      .populate('_user', 'avatarUrl firstName lastName')
      .lean();

    // Prepare dibs.
    gifts.forEach((gift) => {
      // Remove any dibs that do not belong to session user.
      const foundDib = gift.dibs.find((dib) => {
        const isOwner = (dib._user.toString() === userId.toString());

        return isOwner;
      });

      if (foundDib) {
        gift.dibs = [foundDib];
      }
    });

    // Create the recipients array.
    wishLists.forEach((wishList) => {
      // Add gifts to wish list.
      wishList.gifts = gifts.filter((gift) => {
        return (gift._wishList.toString() === wishList._id.toString());
      });

      if (!wishList.gifts) {
        return;
      }

      const foundRecipient = recipients.find((recipient) => {
        return (recipient.id.toString() === wishList._user._id.toString());
      });

      // Add to existing recipient?
      if (foundRecipient) {
        foundRecipient.wishLists.push(
          formatWishListResponse(wishList, userId)
        );
        return;
      }

      // Add a new recipient.
      recipients.push({
        id: wishList._user._id,
        firstName: wishList._user.firstName,
        lastName: wishList._user.lastName,
        avatarUrl: wishList._user.avatarUrl,
        wishLists: [
          formatWishListResponse(wishList, userId)
        ]
      });
    });

    recipients.forEach(getSumBudget);

    authResponse({
      data: {
        recipients
      }
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDibsRecipients
};

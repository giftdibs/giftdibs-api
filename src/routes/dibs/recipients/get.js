const authResponse = require('../../../middleware/auth-response');

const {
  WishList
} = require('../../../database/models/wish-list');

const {
  formatWishListResponse
} = require('../../wish-lists/shared');

function getSumBudget(recipient) {
  let total = 0;

  recipient.wishLists.forEach((wishList) => {
    wishList.gifts.forEach((gift) => {
      let alreadyPaid = false;

      gift.dibs.forEach((dib) => {
        if (dib.pricePaid !== undefined) {
          alreadyPaid = true;
          total += parseInt(dib.pricePaid, 10);
        }
      });

      if (!alreadyPaid && gift.budget !== undefined) {
        total += parseInt(gift.budget, 10);
      }
    });
  });

  recipient.budget = total;
}

function getDibsRecipients(req, res, next) {
  const recipients = [];
  const userId = req.user._id;

  // Get all wish lists that include the session user's dibs.
  WishList
    .findAuthorized(userId, {
      'gifts.dibs._user': userId
    })
    .then((wishLists) => {
      wishLists = wishLists.map((wishList) => {
        const gifts = [];

        wishList.gifts.forEach((gift) => {
          // Remove any dibs that do not belong to session user.
          const foundDib = gift.dibs.find((dib) => {
            return (dib._user._id.toString() === userId.toString());
          });

          // Remove all gifts except those that were dibbed.
          if (foundDib) {
            gift.dibs = [foundDib];
            gifts.push(gift);
          }
        });

        wishList.gifts = gifts;

        return formatWishListResponse(wishList, userId);
      });

      // Create the recipients array.
      wishLists.forEach((wishList) => {
        const foundRecipient = recipients.find((recipient) => {
          return (recipient.id.toString() === wishList.user.id.toString());
        });

        // Add to existing recipient?
        if (foundRecipient) {
          foundRecipient.wishLists.push(wishList);
          return;
        }

        // Add a new recipient.
        recipients.push({
          id: wishList.user.id,
          firstName: wishList.user.firstName,
          lastName: wishList.user.lastName,
          wishLists: [wishList]
        });
      });

      recipients.forEach(getSumBudget);

      return recipients;
    })
    .then((recipients) => {
      authResponse({
        data: { recipients }
      })(req, res, next);
    });
}

module.exports = {
  getDibsRecipients
};

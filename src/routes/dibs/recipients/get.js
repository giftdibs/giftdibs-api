const authResponse = require('../../../middleware/auth-response');

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

function getDibsRecipients(req, res, next) {
  const recipients = [];
  const userId = req.user._id;
  const status = req.query.status;

  // Get all wish lists that include the session user's dibs.
  WishList.findAuthorized(userId, {
    'gifts.dibs._user': userId
  })
    .then((wishLists) => {
      wishLists = wishLists.map((wishList) => {
        const gifts = [];

        wishList.gifts.forEach((gift) => {
          // Remove any dibs that do not belong to session user.
          const foundDib = gift.dibs.find((dib) => {
            const isOwner = (dib._user._id.toString() === userId.toString());

            if (isOwner) {
              // Only return delivered dibs.
              if (status === 'delivered' && dib.dateDelivered) {
                return true;
              }

              // Only return non-delivered dibs.
              if (status !== 'delivered' && !dib.dateDelivered) {
                return true;
              }
            }

            return false;
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
      // Only return recipients that have non-empty gifts arrays.
      recipients = recipients.filter((recipient) => {
        const wishLists = recipient.wishLists.filter((wishList) => {
          return (wishList.gifts && wishList.gifts.length);
        });

        return (wishLists && wishLists.length);
      });

      authResponse({
        data: {
          recipients
        }
      })(req, res, next);
    });
}

module.exports = {
  getDibsRecipients
};

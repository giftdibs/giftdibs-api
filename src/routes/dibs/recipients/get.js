const authResponse = require('../../../middleware/auth-response');

const {
  formatGiftResponse,
  Gift
} = require('../../../database/models/gift');

const {
  WishList
} = require('../../../database/models/wish-list');

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

  let dibbedGifts;
  let dibbedGiftIds;

  Gift
    .find({
      'dibs._user': userId
    })
    .populate('dibs._user', 'firstName lastName')
    .lean()
    .then((gifts) => {
      dibbedGifts = gifts;
      dibbedGiftIds = gifts.map((gift) => gift._id.toString());

      return WishList.findAuthorized(userId, {
        '_gifts': {
          '$in': dibbedGiftIds
        }
      });
    })
    .then((wishLists) => {
      wishLists.forEach((wishList) => {
        // Remove all gifts except those that were dibbed.
        wishList.gifts = wishList.gifts.filter((gift) => {
          return (dibbedGiftIds.indexOf(gift._id.toString()) > -1);
        });

        // Map the populated dibbed gift to the gifts in the wish list.
        wishList.gifts = wishList.gifts.map((gift) => {
          const found = dibbedGifts.find((dibbedGift) => {
            return (dibbedGift._id.toString() === gift._id.toString());
          });

          // Remove any dibs that do not belong to session user.
          found.dibs = found.dibs.filter((dib) => {
            return (dib._user._id.toString() === userId.toString());
          });

          // Format the gifts response.
          return formatGiftResponse(found, wishList, userId);
        });

        // Format the wish list response.
        delete wishList.privacy;

        // Add to existing recipient?
        const foundRecipient = recipients.find((recipient) => {
          return (recipient._id.toString() === wishList.user._id.toString());
        });
        if (foundRecipient) {
          foundRecipient.wishLists.push(wishList);
          return;
        }

        // Add a new recipient.
        recipients.push({
          _id: wishList.user._id,
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
    })
    .catch(next);
}

module.exports = {
  getDibsRecipients
};

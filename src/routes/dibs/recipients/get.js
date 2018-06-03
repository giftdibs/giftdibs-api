const authResponse = require('../../../middleware/auth-response');

const { Gift } = require('../../../database/models/gift');
const { WishList } = require('../../../database/models/wish-list');

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
  let dibbedGiftIds;

  Gift
    .find({
      'dibs._user': req.user._id
    })
    .lean()
    .then((gifts) => {
      dibbedGiftIds = gifts.map((gift) => gift._id.toString());

      return WishList.findAuthorized(req.user._id, {
        '_gifts': {
          '$in': dibbedGiftIds
        }
      });
    })
    .then((wishLists) => {
      // Remove all gifts except those that were dibbed.
      wishLists.forEach((wishList) => {
        wishList.gifts = wishList.gifts.filter((gift) => {
          return (dibbedGiftIds.indexOf(gift._id.toString()) > -1);
        });
      });

      wishLists.forEach((wishList) => {
        const found = recipients.find((recipient) => {
          return (recipient._id.toString() === wishList.user._id.toString());
        });

        if (found) {
          found.wishLists.push(wishList);
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

      // Remove any dibs that do not belong to session user.
      // Also, format the dib.user field.
      recipients.forEach((recipient) => {
        recipient.wishLists.forEach((wishList) => {
          wishList.gifts.forEach((gift) => {
            gift.user = wishList.user;
            delete gift._user;
            gift.dibs = gift.dibs.filter((dib) => {
              const isDibOwner = (
                dib.user._id.toString() ===
                req.user._id.toString()
              );
              if (dib.user._id && isDibOwner) {
                // TODO: Is there a consistent way to handle this?
                // (Getting dibs elsewhere automatically populates dib user.)
                dib.user = {
                  _id: req.user._id,
                  firstName: req.user.firstName,
                  lastName: req.user.lastName
                };

                return true;
              }

              return false;
            });
          });
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

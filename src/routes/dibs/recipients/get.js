const authResponse = require('../../../middleware/auth-response');

const { Gift } = require('../../../database/models/gift');
const { Dib } = require('../../../database/models/dib');

function getSumBudget(recipient) {
  let total = 0;

  recipient.gifts.forEach((gift) => {
    // `_dib` is added to the model manually by getDibsRecipients().
    if (gift._dib.pricePaid !== undefined) {
      total += parseInt(gift._dib.pricePaid, 10);
      return;
    }

    if (gift.budget !== undefined) {
      total += parseInt(gift.budget, 10);
    }
  });

  recipient.budget = total;
}

function getDibsRecipients(req, res, next) {
  Dib
    .find({ _user: req.user._id })
    .lean()
    .then((dibs) => {
      const giftIds = dibs.map((dib) => dib._gift.toString());
      const recipients = [];

      return Gift
        .find({})
        .where('_id')
        .in(giftIds)
        .populate('_user _wishList')
        .lean()
        .then((gifts) => {
          gifts.forEach((gift) => {
            // Match the specific dib to the gift.
            dibs.forEach((dib) => {
              if (dib._gift.toString() === gift._id.toString()) {
                gift._dib = dib;
              }
            });

            const recipient = recipients.filter((recipient) => {
              return (recipient._id.toString() === gift._user._id.toString());
            })[0];

            if (recipient) {
              recipient.gifts.push(gift);
              return;
            }

            // Add a new recipient.
            recipients.push({
              _id: gift._user._id,
              firstName: gift._user.firstName,
              lastName: gift._user.lastName,
              gifts: [gift]
            });
          });

          recipients.forEach(getSumBudget);

          authResponse({
            data: { recipients }
          })(req, res, next);
        });
    })
    .catch(next);
}

module.exports = {
  getDibsRecipients
};

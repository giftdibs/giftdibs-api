const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');

const { Notification } = require('../../database/models/notification');

const { WishList } = require('../../database/models/wish-list');

const { GiftValidationError } = require('../../shared/errors');

const { handleError } = require('./shared');

async function updateGift(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;
  const attributes = req.body;

  try {
    const gift = await Gift.confirmUserOwnership(giftId, userId);

    if (gift.dateReceived) {
      throw new GiftValidationError(
        'You may not edit a gift that has been received.'
      );
    }

    const wishLists = await WishList.find({
      _id: gift._wishList,
    })
      .limit(1)
      .select('_id');

    const wishList = wishLists[0];

    gift.updateSync(attributes);

    await gift.save();
    await wishList.save();

    authResponse({
      data: {},
      message: 'Gift successfully updated.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

async function markGiftAsReceived(req, res, next) {
  const giftId = req.params.giftId;
  const user = req.user;
  const userId = user._id;

  try {
    const gift = await Gift.confirmUserOwnership(giftId, userId);

    if (!gift.dateReceived) {
      const wishLists = await WishList.find({
        _id: gift._wishList,
      })
        .limit(1)
        .select('_id');

      const wishList = wishLists[0];

      gift.set('dateReceived', new Date());

      await gift.save();
      await wishList.save();

      // Send notification and email to dibbers
      // of this gift to mark dib as delivered.
      const promises = gift.dibs.map((dib) => {
        return Notification.notifyGiftReceived(dib._user, user, gift, dib);
      });

      await Promise.all(promises);
    }

    authResponse({
      data: {},
      message: 'Gift successfully marked as received.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  markGiftAsReceived,
  updateGift,
};

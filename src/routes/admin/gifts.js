const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

async function deleteGift(req, res, next) {
  const giftId = req.params.giftId;

  try {
    const gifts = await Gift.find({
      _id: giftId
    })
      .limit(1)
      .select('_id');

    const gift = gifts[0];

    if (!gift) {
      next(new Error('Gift not found.'));
      return;
    }

    await gift.remove();

    authResponse({
      data: { },
      message: 'Gift successfully deleted.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function getGifts(req, res, next) {
  try {
    const gifts = await Gift.find({})
      .select('_user dateUpdated imageUrl name')
      .populate('_user', 'firstName lastName')
      .sort('-dateUpdated')
      .lean();

    const formatted = gifts.map((gift) => {
      return {
        dateUpdated: gift.dateUpdated,
        id: gift._id,
        imageUrl: gift.imageUrl,
        name: gift.name,
        user: {
          id: gift._user._id,
          firstName: gift._user.firstName,
          lastName: gift._user.lastName
        }
      };
    });

    authResponse({
      data: {
        gifts: formatted
      }
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteGift,
  getGifts
};

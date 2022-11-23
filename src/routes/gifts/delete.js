const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');

const { WishList } = require('../../database/models/wish-list');

const { handleError } = require('./shared');

async function deleteGift(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  try {
    const gift = await Gift.confirmUserOwnership(giftId, userId);

    const wishLists = await WishList.find({
      _id: gift._wishList,
    })
      .limit(1)
      .select('_id');

    const wishList = wishLists[0];

    await gift.remove();
    await wishList.save();

    authResponse({
      data: {},
      message: 'Gift successfully deleted.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  deleteGift,
};

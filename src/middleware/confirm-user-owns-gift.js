const { Gift } = require('../database/models/gift');

const {
  GiftNotFoundError,
  GiftPermissionError
} = require('../shared/errors');

function confirmUserOwnsGift(req, res, next) {
  const giftId = req.params.giftId || req.body._gift;

  if (giftId === undefined) {
    next(new GiftNotFoundError());
    return;
  }

  Gift
    .find({ _id: giftId })
    .limit(1)
    .lean()
    .then((docs) => {
      const doc = docs[0];

      if (!doc) {
        return Promise.reject(new GiftNotFoundError());
      }

      if (req.user._id.toString() === doc._user.toString()) {
        next();
        return;
      }

      return Promise.reject(new GiftPermissionError());
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsGift
};

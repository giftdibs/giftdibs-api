const authResponse = require('../../middleware/auth-response');

const {
  DibValidationError
} = require('../../shared/errors');

const {
  handleError,
  validateDibQuantity
} = require('./shared');

const { Gift } = require('../../database/models/gift');
const { Dib } = require('../../database/models/dib');

function checkUserAlreadyDibbed(giftId, userId) {
  // Fail if the current user has already dibbed this gift.
  return Dib
    .find({
      _gift: giftId,
      _user: userId
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const dib = docs[0];

      if (!dib) {
        return;
      }

      return Promise.reject(
        new DibValidationError('You have already dibbed that gift.')
      );
    });
}

function confirmUserDoesNotOwnGift(giftId, userId) {
  // Do not allow owner to dib their own gift.
  return Gift
    .find({
      _id: giftId,
      _user: userId
    })
    .lean()
    .then((docs) => {
      // Gift not owned by current user, so it's a pass!
      if (!docs[0]) {
        return;
      }

      // User owns the gift; invalidated the request.
      return Promise.reject(
        new DibValidationError('You cannot dib your own gift.')
      );
    });
}

function createDib(req, res, next) {
  const giftId = req.body._gift;
  const userId = req.user._id;

  confirmUserDoesNotOwnGift(giftId, userId)
    .then(() => checkUserAlreadyDibbed(giftId, userId))
    .then(() => validateDibQuantity(req))
    .then(() => {
      const dib = new Dib({
        _gift: req.body._gift,
        _user: req.user._id,
        quantity: req.body.quantity
      });

      return dib.save();
    })
    .then((dib) => {
      authResponse({
        dibId: dib._id,
        message: 'Gift successfully dibbed!'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createDib
};

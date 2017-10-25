const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsDib } = require('../middleware/confirm-user-owns-dib');

const {
  DibNotFoundError,
  DibValidationError,
  DibQuantityError,
  GiftNotFoundError
} = require('../shared/errors');

const { Gift } = require('../database/models/gift');
const { Dib } = require('../database/models/dib');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new DibValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function checkAlreadyDibbed(req, res, next) {
  // Fail if the current user has already dibbed this gift.
  Dib
    .find({
      _gift: req.body._gift,
      _user: req.user._id
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const dib = docs[0];

      if (dib) {
        next(new DibValidationError('You have already dibbed that gift.'));
        return;
      }

      next();
    })
    .catch(next);
}

function validateDibQuantity(req) {
  if (req.body.quantity === undefined) {
    req.body.quantity = 1;
  }

  return Promise.all([
    Gift.find({ _id: req.body._gift }).limit(1).lean(),
    Dib.find({ _gift: req.body._gift }).lean()
  ])
    .then((results) => {
      const gift = results[0][0];
      const dibs = results[1];

      let totalDibs = req.body.quantity;

      if (!gift) {
        return Promise.reject(new GiftNotFoundError());
      }

      if (gift.quantity === 1 && totalDibs === 1) {
        return;
      }

      dibs.forEach((dib) => {
        // Don't count the quantity of a dib that's being updated.
        if (req.params.dibId === dib._id.toString()) {
          return;
        }

        totalDibs += dib.quantity;
      });

      if (totalDibs > gift.quantity) {
        const err = new DibQuantityError();

        err.errors = [{
          message: 'Dib quantity is more than are available. Please choose a smaller amount.',
          field: 'quantity'
        }];

        return Promise.reject(err);
      }

      return true;
    });
}

function confirmUserDoesNotOwnGift(req, res, next) {
  // Do not allow owner to dib their own gift.
  Gift
    .find({
      _id: req.body._gift,
      _user: req.user._id
    })
    .lean()
    .then((docs) => {
      if (docs[0]) {
        next(new DibValidationError('You cannot dib your own gift.'));
        return;
      }

      next();
    })
    .catch(next);
}

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

const getDibsRecipients = [
  (req, res, next) => {
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
              recipients
            })(req, res, next);
          });
      })
      .catch(next);
  }
];

const createDib = [
  confirmUserDoesNotOwnGift,
  checkAlreadyDibbed,

  (req, res, next) => {
    validateDibQuantity(req)
      .then(() => {
        const dib = new Dib({
          _gift: req.body._gift,
          _user: req.user._id,
          quantity: req.body.quantity
        });

        return dib.save();
      })
      .then((doc) => {
        authResponse({
          dibId: doc._id,
          message: 'Gift successfully dibbed!'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const updateDib = [
  confirmUserOwnsDib,

  (req, res, next) => {
    validateDibQuantity(req)
      .then(() => {
        return Dib
          .find({ _id: req.params.dibId })
          .limit(1);
      })
      .then((docs) => {
        const dib = docs[0];

        if (!dib) {
          next(new DibNotFoundError());
          return;
        }

        dib.update(req.body);

        return dib.save();
      })
      .then(() => {
        authResponse({
          message: 'Dib successfully updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const deleteDib = [
  confirmUserOwnsDib,

  (req, res, next) => {
    Dib
      .remove({ _id: req.params.dibId })
      .then(() => {
        authResponse({
          message: 'Dib successfully removed.'
        })(req, res, next);
      })
      .catch(next);
  }
];

const getDibs = [
  (req, res, next) => {
    if (req.query.wishListId) {
      next();
      return;
    }

    Dib
      .find({ _user: req.user._id })
      .lean()
      .then((dibs) => {
        authResponse({
          dibs
        })(req, res, next);
      })
      .catch(next);
  },

  // TODO: Make sure user has permission to retrieve dibs from this wish list,
  // once we've established wish list privacy.

  (req, res, next) => {
    Gift
      // get all gifts in a wish list, not owned by current user.
      // (we don't want to retrieve dibs for current user)
      .find({
        _wishList: req.query.wishListId,
        _user: { $ne: req.user._id }
      })
      .lean()
      .then((gifts) => {
        const giftIds = gifts.map(gift => gift._id);

        return Dib
          .find({})
          .where('_gift')
          .in(giftIds)
          .populate('_user', 'firstName lastName')
          .lean();
      })
      .then((dibs) => {
        authResponse({
          dibs
        })(req, res, next);
      })
      .catch(next);
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/dibs')
  .get(getDibs)
  .post(createDib);
router.route('/dibs/:dibId')
  .patch(updateDib)
  .delete(deleteDib);
router.route('/dibs-recipients')
  .get(getDibsRecipients);

module.exports = {
  middleware: {
    createDib,
    deleteDib,
    getDibs,
    getDibsRecipients,
    updateDib
  },
  router
};

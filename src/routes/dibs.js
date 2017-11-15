const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const {
  DibValidationError,
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
  return Dib
    .find({
      _gift: req.body._gift,
      _user: req.user._id
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
        const err = new DibValidationError();

        err.errors = [{
          message: [
            'Dib quantity is more than are available.',
            'Please choose a smaller amount.'
          ].join(' '),
          field: 'quantity'
        }];

        return Promise.reject(err);
      }

      return true;
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
            recipients
          })(req, res, next);
        });
    })
    .catch(next);
}

function createDib(req, res, next) {
  const giftId = req.body._gift;
  const userId = req.user._id;

  confirmUserDoesNotOwnGift(giftId, userId)
    .then(() => checkAlreadyDibbed(giftId, userId))
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

function updateDib(req, res, next) {
  Dib
    .confirmUserOwnership(req.params.dibId, req.user._id)
    .then((dib) => validateDibQuantity(req).then(() => dib))
    .then((dib) => {
      dib.updateSync(req.body);
      return dib.save();
    })
    .then(() => {
      authResponse({
        message: 'Dib successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

function deleteDib(req, res, next) {
  Dib
    .confirmUserOwnership(req.params.dibId, req.user._id)
    .then(() => Dib.remove({ _id: req.params.dibId }))
    .then(() => {
      authResponse({
        message: 'Dib successfully removed.'
      })(req, res, next);
    })
    .catch(next);
}

// TODO: Make sure user has permission to retrieve dibs from this wish list,
// once we've established wish list privacy.
function getDibs(req, res, next) {
  if (!req.query.wishListId) {
    next(
      new DibValidationError('Please provide a wish list ID.')
    );

    return;
  }

  // User wishes to retrieve all dibs for a given wish list.
  // (If the user owns the wish list, do not retrieve any dib information!)

  // Get all gifts in a wish list, not owned by current user.
  // (we don't want to retrieve dibs for current user)
  Gift
    .find({
      _wishList: req.query.wishListId,
      _user: { $ne: req.user._id }
    })
    .lean()
    .then((gifts) => {
      const giftIds = gifts.map((gift) => gift._id);

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

const router = express.Router();
router.use(authenticateJwt);
router.route('/dibs')
  .get(getDibs)
  .post(createDib);
router.route('/dibs/:dibId')
  .patch(updateDib)
  .delete(deleteDib);
router.route('/dibs/recipients')
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

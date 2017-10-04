const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { confirmUserOwnsDib } = require('../middleware/confirm-user-owns-dib');

const {
  DibNotFoundError,
  DibPermissionError,
  DibValidationError,
  GiftAlreadyDibbedError
} = require('../shared/errors');

const WishList = require('../database/models/wish-list');
const Dib = require('../database/models/dib');

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
  Dib
    .find({ _gift: req.body._gift })
    .limit(1)
    .lean()
    .then((docs) => {
      const dib = docs[0];

      if (dib) {
        next(new GiftAlreadyDibbedError());
        return;
      }

      next();
    })
    .catch(next);
}

function confirmUserDoesNotOwnWishList(req, res, next) {
  WishList
    .find({
      'gifts._id': req.body._gift,
      '_user': req.body._user
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const wishList = docs[0];

      if (!wishList) {
        next();
        return;
      }

      next(new DibPermissionError());
    })
    .catch(next);
}

function getSumBudget(recipient) {
  let total = 0;

  recipient.gifts.forEach((gift) => {
    if (gift.dib.pricePaid) {
      total += parseInt(gift.dib.pricePaid, 10);
      return;
    }

    if (gift.budget) {
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

        return WishList
          .find({})
          .where('gifts._id')
          .in(giftIds)
          .populate('_user')
          .lean()
          .then((wishLists) => {
            wishLists.forEach((wishList) => {
              const dibbedGifts = wishList.gifts.filter((gift) => {
                return (giftIds.includes(gift._id.toString()));
              });

              dibbedGifts.forEach((gift) => {
                // Set wish list information.
                gift.wishList = {
                  _id: wishList._id,
                  name: wishList.name
                };

                // Assign the specific dib to the gift.
                dibs.forEach((dib) => {
                  if (dib._gift.toString() === gift._id.toString()) {
                    gift.dib = dib;
                  }
                });

                const recipient = recipients.filter((recipient) => {
                  return (recipient._id.toString() === wishList._user._id.toString());
                })[0];

                if (recipient) {
                  recipient.gifts.push(gift);
                  return;
                }

                // Add a new recipient.
                recipients.push({
                  _id: wishList._user._id,
                  firstName: wishList._user.firstName,
                  lastName: wishList._user.lastName,
                  gifts: [gift]
                });
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
  confirmUserDoesNotOwnWishList,
  checkAlreadyDibbed,

  (req, res, next) => {
    const dib = new Dib({
      _gift: req.body._gift,
      _user: req.body._user
    });

    dib
      .save()
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
    Dib
      .find({ _id: req.params.dibId })
      .limit(1)
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

const router = express.Router();
router.use(authenticateJwt);
router.route('/dibs')
  .post(createDib);
router.route('/dibs/:dibId')
  .patch(updateDib)
  .delete(deleteDib);
router.route('/dibs-recipients')
  .get(getDibsRecipients);

module.exports = {
  middleware: {
    getDibsRecipients,
    updateDib,
    deleteDib,
    createDib
  },
  router
};

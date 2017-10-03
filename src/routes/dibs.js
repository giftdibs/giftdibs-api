const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const {
  DibNotFoundError,
  DibPermissionError,
  GiftAlreadyDibbedError
} = require('../shared/errors');

const WishList = require('../database/models/wish-list');
const Dib = require('../database/models/dib');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    err.code = 401;
    err.status = 400;
    err.message = 'Gift update validation failed.';
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

function confirmUserOwnsDib(req, res, next) {
  Dib
    .find({
      _id: req.params.dibId,
      _user: req.user._id
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const dib = docs[0];

      if (!dib) {
        next(new DibPermissionError());
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

const getDibsRecipients = [
  (req, res, next) => {
    Dib
      .find({
        _user: req.user._id
      })
      .lean()
      .then((dibs) => {
        // need to manually populate _gift, since it's just an array on wishlist
        const giftIds = dibs.map((dib) => dib._gift.toString());

        /*
        1. Get all wish lists where the user has dibbed a gift.
        2. Group the response by wishlist owner, such that:
        {
          dibInfo: {
            recipients: [
              {
                name;
                wishList: {
                  _id;
                  name;
                  gifts: [
                    {
                      name;
                      budget;
                      externalUrls;

                      _dib: {} // as it applies to the requestor
                    }
                  ]
                }
              }
            ]
          }
        }
        */

        const recipients = [];

        WishList
          .find({})
          .where('gifts._id')
          .in(giftIds)
          .populate('_user')
          .lean()
          .then((wishLists) => {
            wishLists.forEach((wishList) => {
              // Only return the gifts that are dibbed by the current user.
              wishList.gifts = wishList.gifts.filter((gift) => {
                return (giftIds.includes(gift._id.toString()));
              });

              wishList.gifts.forEach((gift) => {
                const giftInfo = gift;

                giftInfo.wishList = {
                  _id: wishList._id,
                  name: wishList.name
                };

                dibs.forEach((dib) => {
                  if (dib._gift.toString() === gift._id.toString()) {
                    giftInfo.dib = dib;
                  }
                });

                const recipient = recipients.filter((recipient) => {
                  return (recipient._id.toString() === wishList._user._id.toString());
                })[0];

                if (recipient) {
                  recipient.gifts.push(giftInfo);
                } else {
                  recipients.push({
                    _id: wishList._user._id,
                    firstName: wishList._user.firstName,
                    lastName: wishList._user.lastName,
                    gifts: [giftInfo]
                  });
                }
              });
            });

            recipients.forEach((recipient) => {
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
            });

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

  function createDib(req, res, next) {
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

        return dib;
      })
      .then((dib) => {
        // Update the date delivered if user marks the dib as delivered (for the first time).
        if (req.body.isDelivered === true && !dib.isDelivered) {
          req.body.dateDelivered = new Date();
        } else if (req.body.isDelivered === false) {
          req.body.dateDelivered = null;
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

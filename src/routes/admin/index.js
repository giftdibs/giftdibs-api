const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const router = express.Router();

function authenticateRole(req, res, next) {
  if (req.user.role !== 'admin') {
    const error = new Error(
      'You do not have the necessary permissions to view that resource.'
    );
    error.status = 403;
    next(error);
    return;
  }

  next();
}

const {
  getGifts,
  deleteGift
} = require('./gifts');

const {
  createMailingListSubscription,
  removeMailingListSubscription,
  updateMailingListSubscription
} = require('./mailing-list-subscription');

const {
  getUsers,
  deleteUser
} = require('./users');

router.route('/admin/gifts')
  .get([
    authenticateJwt,
    authenticateRole,
    getGifts
  ]);

router.route('/admin/gifts/:giftId')
  .delete([
    authenticateJwt,
    authenticateRole,
    deleteGift
  ]);

router.route('/admin/mailing-list-subscription')
  .post([
    authenticateJwt,
    authenticateRole,
    createMailingListSubscription
  ]);

router.route('/admin/mailing-list-subscription/:emailAddress')
  .delete([
    authenticateJwt,
    authenticateRole,
    removeMailingListSubscription
  ])
  .patch([
    authenticateJwt,
    authenticateRole,
    updateMailingListSubscription
  ])

router.route('/admin/users')
  .get([
    authenticateJwt,
    authenticateRole,
    getUsers
  ]);

router.route('/admin/users/:userId')
  .delete([
    authenticateJwt,
    authenticateRole,
    deleteUser
  ]);

module.exports = router;

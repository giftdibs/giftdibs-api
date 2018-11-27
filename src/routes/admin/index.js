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
  getUsers,
  deleteUser
} = require('./users');

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

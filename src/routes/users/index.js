const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getUser, getUsers } = require('./get');
const { updateUser } = require('./patch');

const router = express.Router();

router.route('/users')
  .get([authenticateJwt, getUsers]);

router.route('/users/:userId')
  .get([authenticateJwt, getUser])
  .patch([authenticateJwt, updateUser]);

module.exports = router;

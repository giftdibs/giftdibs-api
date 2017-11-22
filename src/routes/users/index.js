const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getUser, getUsers } = require('./get');
const { updateUser } = require('./patch');
const { deleteUser } = require('./delete');

const router = express.Router();
router.use(authenticateJwt);
router.route('/users')
  .get(getUsers);
router.route('/users/:userId')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = {
  router
};

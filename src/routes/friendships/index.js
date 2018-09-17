const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getFriendships } = require('./get');
const { createFriendship } = require('./post');
const { deleteFriendship } = require('./delete');

const router = express.Router();
router.use(authenticateJwt);

router.route('/users/:userId/friendships')
  .get(getFriendships);

router.route('/friendships')
  .post(createFriendship)
  .delete(deleteFriendship);

module.exports = {
  router
};

const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getFriendships } = require('./get');
const { createFriendship } = require('./post');
const { deleteFriendship } = require('./delete');

const router = express.Router();
router.use(authenticateJwt);
router.route('/friendships')
  .get(getFriendships)
  .post(createFriendship)
router.route('/friendships/:friendshipId')
  .delete(deleteFriendship);

module.exports = {
  router
};

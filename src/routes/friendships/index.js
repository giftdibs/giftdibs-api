const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getFriendships } = require('./get');
const { createFriendship } = require('./post');
const { deleteFriendship } = require('./delete');

const router = express.Router();

router.route('/users/:userId/friendships')
  .get([authenticateJwt, getFriendships]);

router.route('/friendships')
  .post([authenticateJwt, createFriendship])
  .delete([authenticateJwt, deleteFriendship]);

module.exports = router;

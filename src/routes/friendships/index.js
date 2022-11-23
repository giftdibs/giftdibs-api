const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getFollowing, getFriendships } = require('./get');
const { createFriendship } = require('./post');
const { deleteFriendship } = require('./delete');

const router = express.Router();

router
  .route('/users/:userId/friendships')
  .get([authenticateJwt, getFriendships]);

router
  .route('/users/:userId/friendships/following')
  .get([authenticateJwt, getFollowing]);

router.route('/friendships').post([authenticateJwt, createFriendship]);

router
  .route('/friendships/:friendshipId')
  .delete([authenticateJwt, deleteFriendship]);

module.exports = router;

const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const {
  getArchivedWishLists,
  getWishList,
  getWishLists
} = require('./get');

const { createWishList } = require('./post');
const { updateWishList } = require('./patch');
const { deleteWishList } = require('./delete');

const router = express.Router();

router.route('/wish-lists')
  .get([authenticateJwt, getWishLists])
  .post([authenticateJwt, createWishList]);

router.route('/wish-lists/:wishListId')
  .get([authenticateJwt, getWishList])
  .patch([authenticateJwt, updateWishList])
  .delete([authenticateJwt, deleteWishList]);

router.route('/users/:userId/wish-lists')
  .get([authenticateJwt, getWishLists]);

router.route('/users/:userId/wish-lists/archived')
  .get([authenticateJwt, getArchivedWishLists]);

module.exports = router;

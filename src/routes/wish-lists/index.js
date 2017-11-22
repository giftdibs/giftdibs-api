const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getWishList, getWishLists } = require('./get');
const { createWishList } = require('./post');
const { updateWishList } = require('./patch');
const { deleteWishList } = require('./delete');

const router = express.Router();
router.use(authenticateJwt);
router.route('/wish-lists')
  .get(getWishLists)
  .post(createWishList);
router.route('/wish-lists/:wishListId')
  .get(getWishList)
  .patch(updateWishList)
  .delete(deleteWishList);

module.exports = {
  router
};

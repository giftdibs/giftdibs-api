const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { searchUsers } = require('./users');

const router = express.Router();
router.use(authenticateJwt);
router.route('/search-users')
  .get(searchUsers);
router.route('/search-users/:encodedSearchText')
  .get(searchUsers);

module.exports = {
  router
};

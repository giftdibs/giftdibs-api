const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const {
  searchProductsByKeyword
} = require('./search');

const router = express.Router();

router.route('/products/search')
  .get([authenticateJwt, searchProductsByKeyword]);

module.exports = router;

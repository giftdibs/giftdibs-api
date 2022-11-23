const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { searchProductsByKeyword } = require('./search');

const { findSimilarProductsByAsin } = require('./find-similar');

const router = express.Router();

router
  .route('/products/search')
  .get([authenticateJwt, searchProductsByKeyword]);

router
  .route('/products/similar')
  .get([authenticateJwt, findSimilarProductsByAsin]);

module.exports = router;

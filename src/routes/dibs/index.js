const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getDibs } = require('./get');
const { createDib } = require('./post');
const { updateDib } = require('./patch');
const { deleteDib } = require('./delete');
const { getDibsRecipients } = require('./recipients/get');

const router = express.Router();
router.use(authenticateJwt);
router.route('/dibs')
  .get(getDibs)
  .post(createDib);
router.route('/dibs/:dibId')
  .patch(updateDib)
  .delete(deleteDib);
router.route('/dibs/recipients')
  .get(getDibsRecipients);

module.exports = {
  router
};

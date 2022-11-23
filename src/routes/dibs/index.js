const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { createDib, markDibAsDelivered } = require('./post');
const { updateDib } = require('./patch');
const { deleteDib } = require('./delete');
const { getDibsRecipients } = require('./recipients/get');

const router = express.Router();

router.route('/gifts/:giftId/dibs').post([authenticateJwt, createDib]);

router
  .route('/dibs/:dibId')
  .patch([authenticateJwt, updateDib])
  .delete([authenticateJwt, deleteDib]);

router
  .route('/dibs/:dibId/delivered')
  .post([authenticateJwt, markDibAsDelivered]);

router.route('/dibs/recipients').get([authenticateJwt, getDibsRecipients]);

module.exports = router;

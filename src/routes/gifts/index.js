const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getGift, getGifts } = require('./get');

const { createGift } = require('./post');
const { deleteGift } = require('./delete');
const { updateGift, markGiftAsReceived } = require('./patch');

const router = express.Router();

router.route('/gifts').get([authenticateJwt, getGifts]);

router
  .route('/wish-lists/:wishListId/gifts')
  .post([authenticateJwt, createGift]);

router
  .route('/gifts/:giftId')
  .get([authenticateJwt, getGift])
  .delete([authenticateJwt, deleteGift])
  .patch([authenticateJwt, updateGift]);

router
  .route('/gifts/:giftId/received')
  .patch([authenticateJwt, markGiftAsReceived]);

module.exports = router;

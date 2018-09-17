const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const {
  getGift,
  getGifts
} = require('./get');

const { createGift } = require('./post');
const { deleteGift } = require('./delete');
const { updateGift, markGiftAsReceived } = require('./patch');

const router = express.Router();

router.use(authenticateJwt);

router.route('/gifts')
  .get(getGifts);

router.route('/wish-lists/:wishListId/gifts')
  .post(createGift);

router.route('/gifts/:giftId')
  .get(getGift)
  .delete(deleteGift)
  .patch(updateGift);

router.route('/gifts/:giftId/received')
  .patch(markGiftAsReceived);

module.exports = {
  router
};

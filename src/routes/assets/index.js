const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const {
  deleteAvatar,
  deleteGiftThumbnail
} = require('./delete');

const {
  uploadAvatar,
  uploadGiftThumbnail
} = require('./post');

const router = express.Router();
router.use(authenticateJwt);

router.route('/avatars')
  .delete(deleteAvatar)
  .post(uploadAvatar);

router.route('/gifts/:giftId/thumbnails')
  .delete(deleteGiftThumbnail)
  .post(uploadGiftThumbnail);

module.exports = {
  router
};

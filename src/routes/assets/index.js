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

router.route('/avatars')
  .delete([authenticateJwt, deleteAvatar])
  .post([authenticateJwt, uploadAvatar]);

router.route('/gifts/:giftId/thumbnails')
  .delete([authenticateJwt, deleteGiftThumbnail])
  .post([authenticateJwt, uploadGiftThumbnail]);

module.exports = router;

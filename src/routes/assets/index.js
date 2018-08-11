const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { deleteAvatar } = require('./delete');
const { uploadAvatar } = require('./post');

const router = express.Router();
router.use(authenticateJwt);

router.route('/assets/avatar')
  .delete(deleteAvatar)
  .post(uploadAvatar);

module.exports = {
  router
};

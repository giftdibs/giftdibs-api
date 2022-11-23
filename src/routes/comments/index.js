const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { createComment } = require('./post');
const { deleteComment } = require('./delete');

const { getComment } = require('./get');

const { updateComment } = require('./patch');

const router = express.Router();

router.route('/gifts/:giftId/comments').post([authenticateJwt, createComment]);

router
  .route('/gifts/comments/:commentId')
  .get([authenticateJwt, getComment])
  .patch([authenticateJwt, updateComment])
  .delete([authenticateJwt, deleteComment]);

module.exports = router;

const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { createComment } = require('./post');
const { deleteComment } = require('./delete');

const {
  getComment
  // getComments
} = require('./get');

const { updateComment } = require('./patch');

const router = express.Router();
router.use(authenticateJwt);

router.route('/gifts/:giftId/comments')
  // .get(getComments)
  .post(createComment);

router.route('/gifts/comments/:commentId')
  .get(getComment)
  .patch(updateComment)
  .delete(deleteComment);

module.exports = {
  router
};

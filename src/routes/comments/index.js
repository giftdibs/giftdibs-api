const express = require('express');

const authenticateJwt = require('../../middleware/authenticate-jwt');

const { createComment } = require('./post');
const { deleteComment } = require('./delete');
const { getComments } = require('./get');
const { updateComment } = require('./patch');

const router = express.Router();
router.use(authenticateJwt);

router.route('/comments')
  .get(getComments)
  .post(createComment);

router.route('/comments/:commentId')
  .patch(updateComment)
  .delete(deleteComment);

module.exports = {
  router
};

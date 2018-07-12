const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getMessage, getMessages } = require('./get');
const { createMessage } = require('./post');
const { updateMessage } = require('./patch');
const { deleteMessage } = require('./delete');

const { createReply } = require('./replies/post');
const { updateReply } = require('./replies/patch');
const { deleteReply } = require('./replies/delete');

const router = express.Router();
router.use(authenticateJwt);

router.route('/messages')
  .get(getMessages)
  .post(createMessage);

router.route('/messages/:messageId')
  .get(getMessage)
  .patch(updateMessage)
  .delete(deleteMessage);

router.route('/messages/:messageId/replies')
  .post(createReply);

router.route('/messages/replies/:replyId')
  .patch(updateReply)
  .delete(deleteReply);

module.exports = {
  router
};

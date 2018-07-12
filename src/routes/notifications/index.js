const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getNotifications } = require('./get');
const { updateNotification } = require('./patch');
const { deleteNotification } = require('./delete');

const router = express.Router();
router.use(authenticateJwt);

router.route('/notifications')
  .get(getNotifications);

router.route('/notifications/:notificationId')
  .patch(updateNotification)
  .delete(deleteNotification);

module.exports = {
  router
};

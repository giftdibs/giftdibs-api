const express = require('express');
const authenticateJwt = require('../../middleware/authenticate-jwt');

const { getNotifications } = require('./get');
// const { updateNotification } = require('./patch');
const { deleteNotification } = require('./delete');

const router = express.Router();

router.route('/notifications').get([authenticateJwt, getNotifications]);

router
  .route('/notifications/:notificationId')
  // .patch([authenticateJwt, updateNotification])
  .delete([authenticateJwt, deleteNotification]);

module.exports = router;

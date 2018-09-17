const authResponse = require('../../middleware/auth-response');

const {
  Notification
} = require('../../database/models/notification');

function deleteNotification(req, res, next) {
  const notificationId = req.params.notificationId;
  const userId = req.user._id;

  Notification.confirmUserOwnership(notificationId, userId)
    .then((notification) => notification.remove())
    .then(() => {
      authResponse({
        notification: 'Notification successfully deleted.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteNotification
};

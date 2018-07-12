const authResponse = require('../../middleware/auth-response');

const {
  Notification
} = require('../../database/models/notification');

const {
  handleError
} = require('./shared');

function updateNotification(req, res, next) {
  const notificationId = req.params.notificationId;
  const userId = req.user._id;

  Notification.confirmUserOwnership(notificationId, userId)
    .then((notification) => {
      notification.updateSync(req.body);
      return notification.save();
    })
    .then(() => {
      authResponse({
        data: { },
        notification: 'Notification updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateNotification
};

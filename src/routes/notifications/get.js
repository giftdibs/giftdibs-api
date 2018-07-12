const authResponse = require('../../middleware/auth-response');

const {
  Notification
} = require('../../database/models/notification');

const {
  formatNotificationResponse
} = require('./shared');

function getNotifications(req, res, next) {
  const userId = req.user._id;

  Notification.find({
    _user: userId
  })
    .sort('-dateCreated')
    .lean()
    .then((notifications) => {
      return notifications.map((notification) => {
        return formatNotificationResponse(notification, userId);
      });
    })
    .then((notifications) => {
      authResponse({
        data: { notifications }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getNotifications
};

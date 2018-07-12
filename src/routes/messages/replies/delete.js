const authResponse = require('../../../middleware/auth-response');

// const {
//   Message
// } = require('../../../database/models/message');

function deleteReply(req, res, next) {
  authResponse({
    message: 'Replies temporarily disabled.'
  })(req, res, next);
  // const messageId = req.params.messageId;
  // const userId = req.user._id;

  // Message.confirmUserOwnership(messageId, userId)
  //   .then((message) => message.remove())
  //   .then(() => {
  //     authResponse({
  //       message: 'Message successfully deleted.'
  //     })(req, res, next);
  //   })
  //   .catch(next);
}

module.exports = {
  deleteReply
};

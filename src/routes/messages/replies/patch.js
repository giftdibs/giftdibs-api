const authResponse = require('../../../middleware/auth-response');

// const {
//   Message
// } = require('../../../database/models/message');

// const {
//   handleError
// } = require('../shared');

function updateReply(req, res, next) {
  authResponse({
    message: 'Replies temporarily disabled.'
  })(req, res, next);
  // const messageId = req.params.messageId;
  // const userId = req.user._id;

  // Message.confirmUserOwnership(messageId, userId)
  //   .then((message) => {
  //     message.updateSync(req.body);
  //     return message.save();
  //   })
  //   .then(() => {
  //     authResponse({
  //       data: { },
  //       message: 'Message updated.'
  //     })(req, res, next);
  //   })
  //   .catch((err) => handleError(err, next));
}

module.exports = {
  updateReply
};

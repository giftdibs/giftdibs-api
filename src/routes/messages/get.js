const authResponse = require('../../middleware/auth-response');

// const {
//   Message
// } = require('../../database/models/message');

// const {
//   formatMessageResponse
// } = require('./shared');

function getMessage(req, res, next) {
  authResponse({
    message: 'Messages temporarily disabled.'
  })(req, res, next);
  // const userId = req.user._id;

  // Message.findAuthorizedById(req.params.messageId, userId)
  //   .then((message) => formatMessageResponse(message, userId))
  //   .then((message) => {
  //     authResponse({
  //       data: { message }
  //     })(req, res, next);
  //   })
  //   .catch(next);
}

function getMessages(req, res, next) {
  authResponse({
    message: 'Messages temporarily disabled.'
  })(req, res, next);
  // const userId = req.user._id;
  // const query = {};

  // if (req.query.userId) {
  //   query._user = req.query.userId;
  // }

  // Message.findAuthorized(userId, query)
  //   .then((messages) => {
  //     return messages.map((message) => {
  //       return formatMessageResponse(message, userId);
  //     });
  //   })
  //   .then((messages) => {
  //     authResponse({
  //       data: { messages }
  //     })(req, res, next);
  //   })
  //   .catch(next);
}

module.exports = {
  getMessage,
  getMessages
};

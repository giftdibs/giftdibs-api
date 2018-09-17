// const {
//   Message
// } = require('../../../database/models/message');

const authResponse = require('../../../middleware/auth-response');

// const {
//   handleError
// } = require('../shared');

function createReply(req, res, next) {
  authResponse({
    message: 'Replies temporarily disabled.'
  })(req, res, next);
  // const message = new Message({
  //   _user: req.user._id,
  //   name: req.body.name,
  //   privacy: req.body.privacy
  // });

  // message.save()
  //   .then((doc) => {
  //     authResponse({
  //       data: { messageId: doc._id },
  //       message: 'Message successfully created.'
  //     })(req, res, next);
  //   })
  //   .catch((err) => handleError(err, next));
}

module.exports = {
  createReply
};

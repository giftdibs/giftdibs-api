const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function createComment(req, res, next) {
  const userId = req.user._id;
  const attributes = req.body;

  WishList.createComment(attributes, userId)
    .then((commentId) => {
      authResponse({
        data: { commentId },
        message: 'Comment successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createComment
};

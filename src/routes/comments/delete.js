const {
  WishList
} = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function deleteComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;

  WishList.removeCommentById(commentId, userId)
    .then(() => {
      authResponse({
        message: 'Comment successfully removed.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  deleteComment
};

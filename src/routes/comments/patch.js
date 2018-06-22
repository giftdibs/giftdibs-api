const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function updateComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;
  const attributes = req.body;

  WishList.updateCommentById(commentId, userId, attributes)
    .then(() => {
      authResponse({
        data: { },
        message: 'Comment successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateComment
};

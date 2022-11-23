const { Gift } = require('../../database/models/gift');

const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

async function deleteComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;

  try {
    await Gift.removeCommentById(commentId, userId);

    authResponse({
      message: 'Comment successfully removed.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  deleteComment,
};

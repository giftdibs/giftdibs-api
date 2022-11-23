const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const { Gift } = require('../../database/models/gift');

async function updateComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;
  const attributes = req.body;

  try {
    await Gift.updateCommentById(commentId, userId, attributes);

    authResponse({
      data: {},
      message: 'Comment successfully updated.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  updateComment,
};

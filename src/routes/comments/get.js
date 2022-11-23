const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');

const { formatCommentResponse, handleError } = require('./shared');

async function getComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;

  try {
    const comment = await Gift.getCommentById(commentId, userId);

    const formatted = formatCommentResponse(comment);

    authResponse({
      data: { comment: formatted },
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  getComment,
};

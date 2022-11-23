const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const { Gift } = require('../../database/models/gift');

async function createComment(req, res, next) {
  const giftId = req.params.giftId;
  const attributes = req.body;

  try {
    const commentId = await Gift.createComment(giftId, attributes, req.user);

    authResponse({
      data: { commentId },
      message: 'Comment successfully created.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  createComment,
};

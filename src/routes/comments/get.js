const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  formatCommentResponse,
  handleError
} = require('./shared');

function getComment(req, res, next) {
  const commentId = req.params.commentId;
  const userId = req.user._id;

  WishList.findAuthorizedByCommentId(commentId, userId)
    .then((wishList) => {
      let foundComment;

      wishList.gifts.find((gift) => {
        if (!gift.comments || !gift.comments.length) {
          return;
        }

        foundComment = gift.comments.find((comment) => {
          return (comment._id.toString() === commentId.toString());
        });

        return foundComment;
      });

      return formatCommentResponse(foundComment);
    })
    .then((comment) => {
      authResponse({
        data: { comment }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  getComment
};

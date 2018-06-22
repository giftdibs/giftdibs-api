const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  CommentNotFoundError
} = require('../../shared/errors');

const {
  formatCommentResponse,
  handleError
} = require('./shared');

function getComments(req, res, next) {
  const giftId = req.query.giftId;
  const userId = req.user._id;

  if (!giftId) {
    throw new CommentNotFoundError(
      'Please provide a gift ID.'
    );
  }

  WishList.getCommentsByGiftId(giftId, userId)
    .then((comments) => {
      return comments.map((comment) => formatCommentResponse(comment));
    })
    .then((comments) => {
      authResponse({
        data: { comments },
        message: 'Comment successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  getComments
};

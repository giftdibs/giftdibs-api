const authResponse = require('../../middleware/auth-response');

const {
  formatPrivacyRequest
} = require('../../middleware/format-privacy-request');

const {
  handleError
  // formatPrivacyRequest
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function updateWishList(req, res, next) {
  const privacy = formatPrivacyRequest(req);

  if (privacy.type === 'custom' && privacy._allow.length === 0) {
    next(new Error(
      'You declared a custom privacy type, but did not provide any user IDs.'
    ));
    return;
  }

  req.body.privacy = privacy;

  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then((wishList) => {
      // formatPrivacyRequest(req.body);
      // wishList.setPrivacySync(req.body);
      wishList.updateSync(req.body.attributes);
      return wishList.save();
    })
    .then((wishList) => {
      authResponse({
        message: 'Wish list updated.',
        data: { wishList }
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateWishList
};

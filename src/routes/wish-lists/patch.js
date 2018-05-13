const { WishList } = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function updateWishList(req, res, next) {
  WishList
    .confirmUserOwnership(req.params.wishListId, req.user._id)
    .then((wishList) => {
      return WishList.sanitizePrivacyRequest(req.body.attributes.privacy)
        .then((privacy) => {
          req.body.attributes.privacy = privacy;
          return wishList;
        });
    })
    .then((wishList) => {
      wishList.updateSync(req.body.attributes);
      return wishList.save();
    })
    .then(() => {
      authResponse({
        data: {},
        message: 'Wish list updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateWishList
};

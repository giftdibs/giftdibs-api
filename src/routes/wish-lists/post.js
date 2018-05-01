const { WishList } = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  formatPrivacyRequest,
  handleError
} = require('./shared');

function createWishList(req, res, next) {
  formatPrivacyRequest(req, next);

  const wishList = new WishList({
    _user: req.user._id,
    name: req.body.attributes.name,
    privacy: req.body.attributes.privacy
  });

  wishList
    .save()
    .then((doc) => {
      authResponse({
        data: { wishListId: doc._id },
        message: 'Wish list successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createWishList
};

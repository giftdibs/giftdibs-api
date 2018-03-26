const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function createWishList(req, res, next) {
  // TODO: Handle privacy here.

  const wishList = new WishList({
    _user: req.user._id,
    name: req.body.name
  });

  wishList
    .save()
    .then((doc) => {
      authResponse({
        wishListId: doc._id,
        message: 'Wish list successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createWishList
};

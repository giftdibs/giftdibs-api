const {
  WishList
} = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function createWishList(req, res, next) {
  const wishList = new WishList({
    _user: req.user._id,
    name: req.body.name,
    privacy: req.body.privacy
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

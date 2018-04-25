const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function createWishList(req, res, next) {
  const wishList = new WishList({
    _user: req.user._id,
    name: req.body.attributes.name
  });

  wishList
    .save()
    .then((doc) => {
      authResponse({
        data: { wishList: doc },
        message: 'Wish list successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createWishList
};

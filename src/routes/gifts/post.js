const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');
const { WishList } = require('../../database/models/wish-list');
const { handleError } = require('./shared');

function createGift(req, res, next) {
  WishList
    .confirmUserOwnership(req.body._wishList, req.user._id)
    .then(() => {
      const gift = new Gift({
        _user: req.user._id,
        _wishList: req.body._wishList,
        budget: req.body.budget,
        externalUrls: req.body.externalUrls,
        name: req.body.name
      });

      return gift.save();
    })
    .then((gift) => {
      authResponse({
        data: { giftId: gift._id },
        message: 'Gift successfully created.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createGift
};

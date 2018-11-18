const authResponse = require('../../middleware/auth-response');

const {
  WishList
} = require('../../database/models/wish-list');

const fileHandler = require('../../shared/file-handler');

const {
  handleError
} = require('./shared');

function deleteGift(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  // TODO: Move this to a first-class method in the wish list schema.
  WishList.confirmUserOwnershipByGiftId(giftId, userId)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);

      gift.remove();

      // Delete gift image from S3.
      if (gift.imageUrl) {
        const fragments = gift.imageUrl.split('/');
        const fileName = fragments[fragments.length - 1];

        return fileHandler.remove(fileName)
          .then(() => wishList.save());
      }

      return wishList.save();
    })
    .then(() => {
      authResponse({
        data: { },
        message: 'Gift successfully deleted.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  deleteGift
};

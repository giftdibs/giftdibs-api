const authResponse = require('../../middleware/auth-response');

const fileHandler = require('../../shared/file-handler');

function deleteAvatar(req, res, next) {
  const avatarUrl = req.user.avatarUrl;

  if (!avatarUrl) {
    authResponse({
      message: 'No avatar to delete.'
    })(req, res, next);
    return;
  }

  const fragments = avatarUrl.split('/');
  const fileName = fragments[fragments.length - 1];

  fileHandler.remove(fileName)
    .then(() => {
      req.user.avatarUrl = undefined;
      return req.user.save();
    })
    .then(() => {
      authResponse({
        message: 'Avatar successfully removed.'
      })(req, res, next);
    })
    .catch(next);
}

function deleteGiftThumbnail(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  if (!giftId) {
    next(new Error(
      'Please provide a gift ID.'
    ));
    return;
  }

  const {
    WishList
  } = require('../../database/models/wish-list');

  WishList.confirmUserOwnershipByGiftId(giftId, userId)
    .then((wishList) => {
      const gift = wishList.gifts.id(giftId);
      const imageUrl = gift.imageUrl;

      if (!imageUrl) {
        return;
      }

      const fragments = imageUrl.split('/');
      const fileName = fragments[fragments.length - 1];

      return fileHandler.remove(fileName)
        .then(() => {
          gift.imageUrl = undefined;
          return wishList.save();
        });
    })
    .then(() => {
      authResponse({
        message: 'Thumbnail successfully removed.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteAvatar,
  deleteGiftThumbnail
};

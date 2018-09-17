const multer = require('multer');
const randomstring = require('randomstring');

const authResponse = require('../../middleware/auth-response');
const fileHandler = require('../../shared/file-handler');

const upload = multer();

function uploadAvatar(req, res, next) {
  const file = req.files[0];
  const fileName = req.user._id + '-' + randomstring.generate();

  fileHandler.upload(file, fileName)
    .then((url) => {
      const oldAvatarUrl = req.user.avatarUrl;

      req.user.avatarUrl = url;

      return req.user.save().then(() => {
        if (oldAvatarUrl) {
          const fragments = oldAvatarUrl.split('/');
          const fileName = fragments[fragments.length - 1];

          return fileHandler.remove(fileName).then(() => url);
        }

        return url;
      });
    })
    .then((url) => {
      authResponse({
        data: { url }
      })(req, res, next);
    })
    .catch(next);
}

function uploadGiftThumbnail(req, res, next) {
  const file = req.files[0];
  const fileName = req.user._id + '-' + randomstring.generate();
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

  let _wishList;

  WishList.confirmUserOwnershipByGiftId(giftId, userId)
    .then((wishList) => {
      _wishList = wishList;

      return fileHandler.upload(file, fileName)
    })
    .then((url) => {
      const gift = _wishList.gifts.id(giftId);
      const oldImageUrl = gift.imageUrl;

      gift.imageUrl = url;

      return _wishList.save().then(() => {
        if (oldImageUrl) {
          const fragments = oldImageUrl.split('/');
          const fileName = fragments[fragments.length - 1];

          return fileHandler.remove(fileName).then(() => url);
        }

        return url;
      });
    })
    .then((url) => {
      authResponse({
        data: { url }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  uploadAvatar: [
    upload.any(),
    uploadAvatar
  ],
  uploadGiftThumbnail: [
    upload.any(),
    uploadGiftThumbnail
  ]
};

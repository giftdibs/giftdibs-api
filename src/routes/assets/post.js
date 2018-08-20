const multer = require('multer');
const randomstring = require('randomstring');

const authResponse = require('../../middleware/auth-response');
const s3 = require('./s3');

const upload = multer();

function uploadAvatar(req, res, next) {
  const file = req.files[0];
  const fileName = req.user._id + '-' + randomstring.generate();

  s3.putImageObject(file, fileName)
    .then((url) => {
      const oldAvatarUrl = req.user.avatarUrl;

      req.user.avatarUrl = url;

      return req.user.save().then(() => {
        // Delete old image from S3.
        if (oldAvatarUrl) {
          const fragments = oldAvatarUrl.split('/');
          const fileName = fragments[fragments.length - 1];

          return s3.deleteObject(fileName).then(() => url);
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

      return s3.putImageObject(file, fileName)
    })
    .then((url) => {
      const gift = _wishList.gifts.id(giftId);
      const oldImageUrl = gift.imageUrl;

      gift.imageUrl = url;

      return _wishList.save().then(() => {
        // Delete old image from S3.
        if (oldImageUrl) {
          const fragments = oldImageUrl.split('/');
          const fileName = fragments[fragments.length - 1];

          return s3.deleteObject(fileName).then(() => url);
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

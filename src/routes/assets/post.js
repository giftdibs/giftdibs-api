const randomstring = require('randomstring');

const authResponse = require('../../middleware/auth-response');
const fileHandler = require('../../shared/file-handler');

const fileParser = require('./file-parser');

function uploadAvatar(req, res, next) {
  const file = req.files[0];
  const fileName = req.user._id + '-' + randomstring.generate();

  fileHandler
    .upload(file, fileName)
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
        data: { url },
      })(req, res, next);
    })
    .catch(next);
}

async function uploadGiftThumbnail(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  if (!giftId) {
    next(new Error('Please provide a gift ID.'));
    return;
  }

  const { Gift } = require('../../database/models/gift');

  try {
    const gift = await Gift.confirmUserOwnership(giftId, userId);

    const file = req.files[0];
    const fileName = `${req.user._id}-${randomstring.generate()}`;
    const url = await fileHandler.upload(file, fileName);

    const oldImageUrl = gift.imageUrl;
    if (oldImageUrl) {
      const fragments = oldImageUrl.split('/');
      const oldFileName = fragments[fragments.length - 1];
      await fileHandler.remove(oldFileName);
    }

    gift.set('imageUrl', url);
    await gift.save();

    authResponse({
      data: { url },
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadAvatar: [fileParser, uploadAvatar],
  uploadGiftThumbnail: [fileParser, uploadGiftThumbnail],
};

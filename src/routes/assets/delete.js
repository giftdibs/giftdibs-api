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

async function deleteGiftThumbnail(req, res, next) {
  const giftId = req.params.giftId;
  const userId = req.user._id;

  if (!giftId) {
    next(new Error(
      'Please provide a gift ID.'
    ));
    return;
  }

  const {
    Gift
  } = require('../../database/models/gift');

  try {
    const gift = await Gift.confirmUserOwnership(giftId, userId);

    const imageUrl = gift.imageUrl;
    if (imageUrl) {
      const fragments = imageUrl.split('/');
      const fileName = fragments[fragments.length - 1];
      await fileHandler.remove(fileName);

      gift.imageUrl = undefined;
      await gift.save();
    }

    authResponse({
      message: 'Thumbnail successfully removed.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteAvatar,
  deleteGiftThumbnail
};

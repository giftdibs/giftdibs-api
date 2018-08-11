const authResponse = require('../../middleware/auth-response');

const s3 = require('./s3');

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

  s3.deleteObject(fileName)
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

module.exports = {
  deleteAvatar
};

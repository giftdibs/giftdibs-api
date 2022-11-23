const { Gift } = require('../../database/models/gift');

const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

async function deleteDib(req, res, next) {
  const dibId = req.params.dibId;
  const userId = req.user._id;

  try {
    await Gift.removeDibById(dibId, userId);

    authResponse({
      message: 'Dib successfully removed.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  deleteDib,
};

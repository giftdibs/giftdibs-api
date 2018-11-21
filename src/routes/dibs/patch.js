const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

const {
  Gift
} = require('../../database/models/gift');

async function updateDib(req, res, next) {
  const dibId = req.params.dibId;
  const userId = req.user._id;
  const attributes = req.body;

  try {
    await Gift.updateDibById(dibId, userId, attributes);

    authResponse({
      data: { },
      message: 'Dib successfully updated.'
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  updateDib
};

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

const {
  WishList
} = require('../../database/models/wish-list');

function updateDib(req, res, next) {
  const dibId = req.params.dibId;
  const userId = req.user._id;
  const attributes = req.body;

  WishList.updateDibById(dibId, userId, attributes)
    .then(() => {
      authResponse({
        data: { },
        message: 'Dib successfully updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateDib
};

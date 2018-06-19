const {
  WishList
} = require('../../database/models/wish-list');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function deleteDib(req, res, next) {
  const dibId = req.params.dibId;
  const userId = req.user._id;

  WishList.removeDibById(dibId, userId)
    .then(() => {
      authResponse({
        message: 'Dib successfully removed.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  deleteDib
};

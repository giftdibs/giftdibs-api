const {
  Gift
} = require('../../database/models/gift');

const authResponse = require('../../middleware/auth-response');

const {
  handleError
} = require('./shared');

function deleteDib(req, res, next) {
  Gift
    .findByDibId(req.params.dibId, req.user._id)
    .then((gift) => {
      const dib = gift.dibs.id(req.params.dibId);
      dib.remove();
      return gift.save();
    })
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

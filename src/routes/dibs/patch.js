const authResponse = require('../../middleware/auth-response');

const {
  handleError,
  validateDibQuantity
} = require('./shared');

const {
  Gift
} = require('../../database/models/gift');

function updateDib(req, res, next) {
  Gift
    .findByDibId(req.params.dibId, req.user._id)
    .then((gift) => validateDibQuantity(gift, req))
    .then((gift) => {
      const dib = gift.dibs.id(req.params.dibId);
      dib.updateSync(req.body);
      return gift.save();
    })
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

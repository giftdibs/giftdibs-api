const authResponse = require('../../middleware/auth-response');

const {
  handleError,
  validateDibQuantity
} = require('./shared');

const { Dib } = require('../../database/models/dib');

function updateDib(req, res, next) {
  Dib
    .confirmUserOwnership(req.params.dibId, req.user._id)
    .then((dib) => validateDibQuantity(req).then(() => dib))
    .then((dib) => {
      dib.updateSync(req.body);
      return dib.save();
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

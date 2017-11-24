const authResponse = require('../../middleware/auth-response');

const { Dib } = require('../../database/models/dib');

function deleteDib(req, res, next) {
  Dib
    .confirmUserOwnership(req.params.dibId, req.user._id)
    .then((dib) => dib.remove())
    .then(() => {
      authResponse({
        message: 'Dib successfully removed.'
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  deleteDib
};

const Dib = require('../database/models/dib');
const { DibPermissionError } = require('../shared/errors');

function confirmUserOwnsDib(req, res, next) {
  Dib
    .find({
      _id: req.params.dibId,
      _user: req.user._id
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const dib = docs[0];

      if (!dib) {
        next(new DibPermissionError());
        return;
      }

      next();
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsDib
};

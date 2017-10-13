const {
  Dib
} = require('../database/models/dib');

const {
  DibNotFoundError,
  DibPermissionError
} = require('../shared/errors');

function confirmUserOwnsDib(req, res, next) {
  const dibId = req.params.dibId;

  if (dibId === undefined) {
    next();
  }

  Dib
    .find({ _id: dibId })
    .limit(1)
    .lean()
    .then((docs) => {
      const doc = docs[0];

      if (!doc) {
        return Promise.reject(new DibNotFoundError());
      }

      if (req.user._id.toString() === doc._user.toString()) {
        next();
        return;
      }

      return Promise.reject(new DibPermissionError());
    })
    .catch(next);
}

module.exports = {
  confirmUserOwnsDib
};

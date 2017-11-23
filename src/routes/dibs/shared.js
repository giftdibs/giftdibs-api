const {
  DibValidationError,
  GiftNotFoundError
} = require('../../shared/errors');

const { Gift } = require('../../database/models/gift');
const { Dib } = require('../../database/models/dib');

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new DibValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function validateDibQuantity(req) {
  if (req.body.quantity === undefined) {
    req.body.quantity = 1;
  }

  return Promise.all([
    Gift.find({ _id: req.body._gift }).limit(1).lean(),
    Dib.find({ _gift: req.body._gift }).lean()
  ])
    .then((results) => {
      const gift = results[0][0];
      const dibs = results[1];

      let totalDibs = req.body.quantity;

      if (!gift) {
        return Promise.reject(new GiftNotFoundError());
      }

      if (gift.quantity === 1 && totalDibs === 1) {
        return;
      }

      dibs.forEach((dib) => {
        // Don't count the quantity of a dib that's being updated.
        if (req.params.dibId === dib._id.toString()) {
          return;
        }

        totalDibs += dib.quantity;
      });

      if (totalDibs > gift.quantity) {
        const err = new DibValidationError();

        err.errors = [{
          message: [
            'Dib quantity is more than are available.',
            'Please choose a smaller amount.'
          ].join(' '),
          field: 'quantity'
        }];

        return Promise.reject(err);
      }

      return true;
    });
}

module.exports = {
  handleError,
  validateDibQuantity
};

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

  const giftId = req.body._gift;

  return Promise.all([
    Gift.find({ _id: giftId }).limit(1).lean(),
    Dib.find({ _gift: giftId }).lean()
  ])
    .then((results) => {
      const gift = results[0][0];
      const dibs = results[1];

      let totalDibs = req.body.quantity;

      if (!gift) {
        return Promise.reject(new GiftNotFoundError());
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
    });
}

module.exports = {
  handleError,
  validateDibQuantity
};

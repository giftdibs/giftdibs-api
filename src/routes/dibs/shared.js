const {
  DibValidationError
} = require('../../shared/errors');

// const {
//   Gift
// } = require('../../database/models/gift');

function formatDibResponse(dib, userId) {
  const dibId = dib._user._id || dib._user;

  const isDibOwner = (
    dibId.toString() === userId.toString()
  );

  if (dib.isAnonymous && !isDibOwner) {
    dib.user = {};
  } else {
    dib.user = dib._user;
  }

  dib.id = dib._id;

  delete dib._user;
  delete dib._id;

  return dib;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new DibValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

function validateDibQuantity(gift, req) {
  if (req.body.quantity === undefined) {
    req.body.quantity = 1;
  }

  let totalDibs = req.body.quantity;

  return new Promise((resolve, reject) => {
    gift.dibs.forEach((dib) => {
      // Don't count the quantity of a dib that's being updated.
      if (req.params.dibId === dib._id.toString()) {
        return;
      }

      totalDibs += parseInt(dib.quantity, 10);
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

      reject(err);
      return;
    }

    resolve(gift);
  });
}

module.exports = {
  formatDibResponse,
  handleError,
  validateDibQuantity
};

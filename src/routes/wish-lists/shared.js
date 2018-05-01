const {
  WishListValidationError
} = require('../../shared/errors');

// Formats the privacy attributes in the request body
// into something the database can use.
function formatPrivacyRequest(req, next) {
  const privacyType = req.body.attributes.privacyType;
  const privacyAllow = req.body.attributes.privacyAllow || [];

  let userIds = [];
  if (privacyType === 'custom') {
    if (privacyAllow.length === 0) {
      next(new WishListValidationError(
        'You declared a custom privacy type, but did not provide any user IDs.'
      ));
      return;
    }

    userIds = privacyAllow.split(',').map((userId) => {
      return userId.trim();
    });
  }

  req.body.attributes.privacy = {
    type: privacyType,
    _allow: userIds
  };

  delete req.body.attributes.privacyType;
  delete req.body.attributes.privacyAllow;
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new WishListValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

module.exports = {
  formatPrivacyRequest,
  handleError
};

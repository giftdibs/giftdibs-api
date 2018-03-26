const {
  WishListValidationError
} = require('../../shared/errors');

// function formatPrivacyRequest(reqBody) {
//   const privacyType = reqBody.privacyType;
//   const privacyAllow = reqBody.privacyAllow;

//   // Format the privacy request into something the database can use.
//   if (privacyType) {
//     const privacy = {
//       value: privacyType
//     };

//     if (privacyType === 'custom') {
//       if (privacyAllow) {
//         const allowedIds = privacyAllow.split(',').map((userId) => {
//           return userId.trim();
//         });

//         if (allowedIds.length > 0) {
//           privacy._allow = allowedIds;
//         } else {
//           // throw error, custom setting needs user ids
//         }
//       }
//     }

//     reqBody.privacy = privacy;
//   }
// }

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
  // formatPrivacyRequest,
  handleError
};

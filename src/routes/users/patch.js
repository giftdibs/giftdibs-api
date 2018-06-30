const facebook = require('../../lib/facebook');
const authResponse = require('../../middleware/auth-response');
const { handleError } = require('./shared');

const {
  User
} = require('../../database/models/user');

function updateWithFacebookProfile(user, reqBody) {
  if (!reqBody.facebookUserAccessToken) {
    return Promise.resolve(user);
  }

  return facebook.verifyUserAccessToken(reqBody.facebookUserAccessToken)
    .then(() => facebook.getProfile(reqBody.facebookUserAccessToken))
    .then((profile) => {
      user.firstName = profile.first_name;
      user.lastName = profile.last_name;
      user.emailAddress = profile.email;
      user.facebookId = profile.id;
      user.emailAddressVerified = true;

      return user;
    });
}

function updateUser(req, res, next) {
  User.confirmUserOwnership(req.params.userId, req.user._id)
    .then((user) => updateWithFacebookProfile(user, req.body))
    .then((user) => {
      // Skip this step if user is updating their profile using Facebook.
      if (req.body.facebookUserAccessToken) {
        return user;
      }

      const emailAddress = (
        req.body &&
        req.body.emailAddress
      );

      // If the email address is being changed, need to re-verify.
      if (emailAddress && (user.emailAddress !== emailAddress)) {
        user.resetEmailAddressVerification();
      }

      return user.updateSync(req.body);
    })
    .then((user) => user.save())
    .then(() => {
      authResponse({
        data: {},
        message: 'User updated.'
      })(req, res, next);
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  updateUser
};

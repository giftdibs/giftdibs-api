const jwt = require('jsonwebtoken');
const env = require('../shared/environment');

module.exports = (data) => {
  const response = data || {};

  const authResponse = (req, res, next) => {
    if (req.user === undefined) {
      res.json(response);
      return;
    }

    const payload = { id: req.user._id };

    const token = jwt.sign(
      payload,
      env.get('JWT_SECRET'),
      {
        expiresIn: '15m'
      }
    );

    response.authResponse = {};
    response.authResponse.token = token;
    response.authResponse.user = {
      id: req.user._id,
      avatarUrl: req.user.avatarUrl,
      facebookId: req.user.facebookId,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      emailAddress: req.user.emailAddress,
      emailAddressVerified: req.user.emailAddressVerified
    };

    res.json(response);
  };

  return authResponse;
};

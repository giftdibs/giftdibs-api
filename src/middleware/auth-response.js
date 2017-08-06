const jwt = require('jsonwebtoken');

module.exports = (data) => {
  const authResponse = (req, res, next) => {
    if (req.user === undefined) {
      const err = new Error('A token cannot be created without an authenticated user.');
      err.status = 400;
      next(err);
      return;
    }

    const response = data || {};
    const payload = { id: req.user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    response.authResponse = {};
    response.authResponse.token = token;
    response.authResponse.user = {
      _id: req.user._id,
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

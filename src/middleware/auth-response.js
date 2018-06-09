const jwt = require('jsonwebtoken');

module.exports = (data) => {
  const response = data || {};

  const authResponse = (req, res, next) => {
    if (req.user === undefined) {
      res.json(response);
      return;
    }

    const payload = { id: req.user.id };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '15m'
      }
    );

    response.authResponse = {};
    response.authResponse.token = token;
    response.authResponse.user = {
      id: req.user.id,
      facebook_id: req.user.facebook_id,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email_address: req.user.email_address,
      email_address_verified: req.user.email_address_verified
    };

    res.json(response);
  };

  return authResponse;
};

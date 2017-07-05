const jwt = require('jsonwebtoken');

const jwtResponse = (req, res, next) => {
  if (req.user === undefined) {
    const err = new Error('[jwt-response] User not found.');
    err.status = 500;
    next(err);
    return;
  }

  const payload = { id: req.user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
};

module.exports = jwtResponse;

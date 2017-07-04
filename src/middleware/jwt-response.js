const jwt = require('jsonwebtoken');

const jwtResponse = (req, res, next) => {
  const payload = { id: req.user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
};

module.exports = jwtResponse;

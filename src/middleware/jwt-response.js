const jwt = require('jsonwebtoken');

const jwtResponse = (req, res, next) => {
  if (req.user === undefined) {
    const err = new Error('A token cannot be created without an authenticated user.');
    err.status = 400;
    next(err);
    return;
  }

  const payload = { id: req.user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({
    token,
    user: req.user
  });
};

module.exports = jwtResponse;

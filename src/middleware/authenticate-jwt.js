const passport = require('passport');

const authenticateJwt = (req, res, next) => {
  passport.authenticate('jwt', (err, user, info) => {
    if (err) {
      next(err);
      return;
    }

    if (!user) {
      const error = new Error();
      error.code = 111;

      switch (info.name) {
        case 'JsonWebTokenError':
          error.message = 'Invalid access token.';
          error.status = 401;
          break;
        case 'TokenExpiredError':
          error.message = 'Access token has expired.';
          error.status = 401;
          break;
        default:
          error.message = info.message;
          error.status = 400;
          break;
      }

      next(error);
      return;
    }

    // Add the found user record to the request to
    // allow other middlewares to access it.
    req.user = user;

    next();
  })(req, res, next);
};

module.exports = authenticateJwt;

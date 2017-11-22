let errorConstructors = {};

function generateErrorConstructor(options) {
  function F(message) {
    this.message = message || options.message;
    this.code = options.code;
    this.status = options.status;
    this.name = options.name;
  };

  F.prototype = Error.prototype;

  Object.defineProperty(F, 'name', {
    value: options.name,
    writable: false
  });

  errorConstructors[options.name] = F;
}

const definitions = [
  {
    name: 'LoginValidationError',
    message: 'Login validation failed.',
    code: 100,
    status: 400
  },
  {
    name: 'LoginNotFoundError',
    message: 'A record could not be found with the credentials provided.',
    code: 101,
    status: 400
  },
  {
    name: 'RegistrationValidationError',
    message: 'Registration validation failed.',
    code: 102,
    status: 400
  },
  {
    name: 'ForgottenPasswordValidationError',
    message: 'Forgotten password validation failed.',
    code: 104,
    status: 400
  },
  {
    name: 'ResetPasswordTokenValidationError',
    message: 'The reset password token is invalid or has expired.',
    code: 106,
    status: 400
  },
  {
    name: 'ResetPasswordValidationError',
    message: 'Reset password validation failed.',
    code: 107,
    status: 400
  },
  {
    name: 'EmailVerificationTokenValidationError',
    message: 'The email address verification token is invalid or has expired.',
    code: 109,
    status: 400
  },
  {
    name: 'UserNotFoundError',
    message: 'User not found.',
    code: 200,
    status: 400
  },
  {
    name: 'UserValidationError',
    message: 'User validation failed.',
    code: 201,
    status: 400
  },
  {
    name: 'UserPermissionError',
    message: 'Permission denied to modify user.',
    code: 202,
    status: 403
  },
  {
    name: 'WishListNotFoundError',
    message: 'Wish list not found.',
    code: 300,
    status: 400
  },
  {
    name: 'WishListValidationError',
    message: 'Wish list validation failed.',
    code: 301,
    status: 400
  },
  {
    name: 'WishListPermissionError',
    message: 'Permission denied to modify wish list.',
    code: 302,
    status: 403
  },
  {
    name: 'GiftNotFoundError',
    message: 'Gift not found.',
    code: 400,
    status: 400
  },
  {
    name: 'GiftValidationError',
    message: 'Gift validation failed.',
    code: 401,
    status: 400
  },
  {
    name: 'GiftPermissionError',
    message: 'Permission denied to modify gift.',
    code: 402,
    status: 403
  },
  {
    name: 'DibNotFoundError',
    message: 'Dib not found.',
    code: 500,
    status: 400
  },
  {
    name: 'DibValidationError',
    message: 'Dib validation failed.',
    code: 501,
    status: 400
  },
  {
    name: 'DibPermissionError',
    message: 'Permission denied to modify dib.',
    code: 502,
    status: 403
  },
  {
    name: 'FriendshipNotFoundError',
    message: 'Friendship not found.',
    code: 600,
    status: 400
  },
  {
    name: 'FriendshipValidationError',
    message: 'Friendship validation failed.',
    code: 601,
    status: 400
  },
  {
    name: 'FriendshipPermissionError',
    message: 'Permission denied to modify friendship.',
    code: 602,
    status: 403
  }
];

definitions.forEach((definition) => {
  generateErrorConstructor(definition);
});

module.exports = errorConstructors;

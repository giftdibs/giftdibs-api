function UserNotFoundError() {
  this.name = 'UserNotFoundError';
  this.message = 'User not found.';
  this.code = 200;
  this.status = 400;
}
UserNotFoundError.prototype = Error.prototype;

function UserValidationError() {
  this.name = 'UserValidationError';
  this.message = 'User validation failed.';
  this.code = 201;
  this.status = 400;
}
UserValidationError.prototype = Error.prototype;

function UserPermissionError() {
  this.name = 'UserPermissionError';
  this.message = 'Permission denied to modify user.';
  this.code = 202;
  this.status = 403;
}
UserPermissionError.prototype = Error.prototype;

function WishListNotFoundError() {
  this.name = 'WishListNotFoundError';
  this.message = 'Wish list not found.';
  this.code = 300;
  this.status = 400;
}
WishListNotFoundError.prototype = Error.prototype;

function WishListValidationError() {
  this.name = 'WishListValidationError';
  this.message = 'Wish list validation failed.';
  this.code = 301;
  this.status = 400;
}
WishListValidationError.prototype = Error.prototype;

function WishListPermissionError() {
  this.name = 'WishListPermissionError';
  this.message = 'Permission denied to modify wish list.';
  this.code = 302;
  this.status = 403;
}
WishListPermissionError.prototype = Error.prototype;

function GiftNotFoundError() {
  this.name = 'GiftNotFoundError';
  this.message = 'Gift not found.';
  this.code = 400;
  this.status = 400;
}
GiftNotFoundError.prototype = Error.prototype;

function GiftValidationError() {
  this.name = 'GiftValidationError';
  this.message = 'Gift validation failed.';
  this.code = 401;
  this.status = 400;
}
GiftValidationError.prototype = Error.prototype;

function GiftPermissionError() {
  this.name = 'GiftPermissionError';
  this.message = 'Permission denied to modify gift.';
  this.code = 402;
  this.status = 403;
}
GiftPermissionError.prototype = Error.prototype;

function DibNotFoundError() {
  this.name = 'DibNotFoundError';
  this.message = 'Dib not found.';
  this.code = 500;
  this.status = 400;
}
DibNotFoundError.prototype = Error.prototype;

function DibValidationError(message) {
  this.name = 'DibValidationError';
  this.message = message || 'Dib validation failed.';
  this.code = 501;
  this.status = 400;
}
DibValidationError.prototype = Error.prototype;

function DibPermissionError() {
  this.name = 'DibPermissionError';
  this.message = 'Permission denied to modify dib.';
  this.code = 502;
  this.status = 403;
}
DibPermissionError.prototype = Error.prototype;

function DibQuantityError() {
  this.name = 'DibQuantityError';
  this.message = 'Dib quantity is not valid.';
  this.code = 504;
  this.status = 400;
}
DibQuantityError.prototype = Error.prototype;

module.exports = {
  UserNotFoundError,
  UserValidationError,
  UserPermissionError,

  WishListNotFoundError,
  WishListValidationError,
  WishListPermissionError,

  GiftNotFoundError,
  GiftValidationError,
  GiftPermissionError,

  DibNotFoundError,
  DibValidationError,
  DibPermissionError,
  DibQuantityError
};

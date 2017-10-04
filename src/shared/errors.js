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

function DibNotFoundError() {
  this.name = 'DibNotFoundError';
  this.message = 'Dib not found.';
  this.code = 500;
  this.status = 400;
}
DibNotFoundError.prototype = Error.prototype;

function DibValidationError() {
  this.name = 'DibValidationError';
  this.message = 'Dib validation failed.';
  this.code = 501;
  this.status = 400;
}
DibValidationError.prototype = Error.prototype;

function DibPermissionError() {
  this.name = 'DibPermissionError';
  this.message = 'You do not have permission to modify that resource.';
  this.code = 502;
  this.status = 403;
}
DibPermissionError.prototype = Error.prototype;

function GiftAlreadyDibbedError() {
  this.name = 'GiftAlreadyDibbedError';
  this.message = 'That gift has already been dibbed.';
  this.code = 503;
  this.status = 400;
}
GiftAlreadyDibbedError.prototype = Error.prototype;

module.exports = {
  UserNotFoundError,
  UserValidationError,
  WishListNotFoundError,
  WishListValidationError,
  GiftNotFoundError,
  GiftValidationError,
  DibNotFoundError,
  DibPermissionError,
  DibValidationError,
  GiftAlreadyDibbedError
};

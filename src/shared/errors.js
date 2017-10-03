function UserNotFoundError() {
  this.name = 'UserNotFoundError';
  this.message = 'User not found.';
  this.code = 200;
  this.status = 400;
}
UserNotFoundError.prototype = Error.prototype;

function WishListNotFoundError() {
  this.name = 'WishListNotFoundError';
  this.message = 'Wish list not found.';
  this.code = 300;
  this.status = 400;
}
WishListNotFoundError.prototype = Error.prototype;

function GiftNotFoundError() {
  this.name = 'GiftNotFoundError';
  this.message = 'Gift not found.';
  this.code = 400;
  this.status = 400;
}
GiftNotFoundError.prototype = Error.prototype;

function DibNotFoundError() {
  this.name = 'DibNotFoundError';
  this.message = 'Dib not found.';
  this.code = 500;
  this.status = 400;
}
DibNotFoundError.prototype = Error.prototype;

function DibPermissionError() {
  this.name = 'DibPermissionError';
  this.message = 'You do not have permission to modify that resource.';
  this.code = 501;
  this.status = 403;
}
DibPermissionError.prototype = Error.prototype;

function GiftAlreadyDibbedError() {
  this.name = 'GiftAlreadyDibbedError';
  this.message = 'That gift has already been dibbed.';
  this.code = 502;
  this.status = 400;
}
GiftAlreadyDibbedError.prototype = Error.prototype;

module.exports = {
  UserNotFoundError,
  WishListNotFoundError,
  GiftNotFoundError,
  DibNotFoundError,
  DibPermissionError,
  GiftAlreadyDibbedError
};

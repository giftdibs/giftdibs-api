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

module.exports = {
  UserNotFoundError,
  WishListNotFoundError,
  GiftNotFoundError
};

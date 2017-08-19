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
  this.code = 302;
  this.status = 400;
}
GiftNotFoundError.prototype = Error.prototype;

module.exports = {
  WishListNotFoundError,
  GiftNotFoundError
};

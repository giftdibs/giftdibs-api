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

function ExternalUrlNotFoundError() {
  this.name = 'ExternalUrlNotFoundError';
  this.message = 'External URL not found.';
  this.code = 500;
  this.status = 400;
}
ExternalUrlNotFoundError.prototype = Error.prototype;

function URLScraperError() {
  this.name = 'URLScraperError';
  this.message = 'Please provide a valid URL.';
  this.code = 600;
  this.status = 400;
}
URLScraperError.prototype = Error.prototype;

module.exports = {
  UserNotFoundError,
  WishListNotFoundError,
  GiftNotFoundError,
  ExternalUrlNotFoundError,
  URLScraperError
};

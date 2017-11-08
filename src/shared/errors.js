function ResetPasswordTokenValidationError() {
  this.name = 'ResetPasswordTokenValidationError';
  this.message = 'The email address verification token is invalid or has expired.';
  this.code = 106;
  this.status = 400;
}
ResetPasswordTokenValidationError.prototype = Error.prototype;

function ResetPasswordValidationError(message) {
  this.name = 'ResetPasswordValidationError';
  this.message = message || 'Reset password validation failed.';
  this.code = 107;
  this.status = 400;
}
ResetPasswordValidationError.prototype = Error.prototype;

function EmailVerificationTokenValidationError(message) {
  this.name = 'EmailVerificationTokenValidationError';
  this.message = message || 'The reset password token is invalid.';
  this.code = 109;
  this.status = 400;
}
EmailVerificationTokenValidationError.prototype = Error.prototype;

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

function FriendshipNotFoundError() {
  this.name = 'FriendshipNotFoundError';
  this.message = 'Friendship not found.';
  this.code = 600;
  this.status = 400;
}
FriendshipNotFoundError.prototype = Error.prototype;

function FriendshipValidationError(message) {
  this.name = 'FriendshipValidationError';
  this.message = message || 'Friendship validation failed.';
  this.code = 601;
  this.status = 400;
}
FriendshipValidationError.prototype = Error.prototype;

function FriendshipPermissionError() {
  this.name = 'FriendshipPermissionError';
  this.message = 'Permission denied to modify friendship.';
  this.code = 602;
  this.status = 403;
}
FriendshipPermissionError.prototype = Error.prototype;

module.exports = {
  ResetPasswordTokenValidationError,
  ResetPasswordValidationError,
  EmailVerificationTokenValidationError,

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

  FriendshipNotFoundError,
  FriendshipValidationError,
  FriendshipPermissionError
};

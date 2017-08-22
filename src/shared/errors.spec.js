describe('error', () => {
  it('should return error constructors', () => {
    const { UserNotFoundError, GiftNotFoundError, WishListNotFoundError } = require('./errors');
    expect(typeof UserNotFoundError).toEqual('function');
    expect(typeof WishListNotFoundError).toEqual('function');
    expect(typeof GiftNotFoundError).toEqual('function');

    let err = new UserNotFoundError();
    expect(err.code).toEqual(200);
    expect(err.status).toEqual(400);

    err = new WishListNotFoundError();
    expect(err.code).toEqual(300);
    expect(err.status).toEqual(400);

    err = new GiftNotFoundError();
    expect(err.code).toEqual(400);
    expect(err.status).toEqual(400);
  });
});

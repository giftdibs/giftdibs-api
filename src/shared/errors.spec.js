describe('error', () => {
  it('should return error constructors', () => {
    const {
      UserNotFoundError,
      GiftNotFoundError,
      WishListNotFoundError,
      ExternalUrlNotFoundError,
      URLScraperError
    } = require('./errors');

    expect(typeof UserNotFoundError).toEqual('function');
    expect(typeof WishListNotFoundError).toEqual('function');
    expect(typeof GiftNotFoundError).toEqual('function');
    expect(typeof ExternalUrlNotFoundError).toEqual('function');
    expect(typeof URLScraperError).toEqual('function');

    let err = new UserNotFoundError();
    expect(err.code).toEqual(200);
    expect(err.status).toEqual(400);

    err = new WishListNotFoundError();
    expect(err.code).toEqual(300);
    expect(err.status).toEqual(400);

    err = new GiftNotFoundError();
    expect(err.code).toEqual(400);
    expect(err.status).toEqual(400);

    err = new ExternalUrlNotFoundError();
    expect(err.code).toEqual(500);
    expect(err.status).toEqual(400);

    err = new URLScraperError();
    expect(err.code).toEqual(600);
    expect(err.status).toEqual(400);
  });
});

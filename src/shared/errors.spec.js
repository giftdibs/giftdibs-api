describe('error', () => {
  it('should return error constructors', () => {
    const {
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
    } = require('./errors');

    expect(typeof UserNotFoundError).toEqual('function');
    expect(typeof UserValidationError).toEqual('function');
    expect(typeof WishListNotFoundError).toEqual('function');
    expect(typeof WishListValidationError).toEqual('function');
    expect(typeof GiftNotFoundError).toEqual('function');
    expect(typeof GiftValidationError).toEqual('function');
    expect(typeof DibNotFoundError).toEqual('function');
    expect(typeof DibValidationError).toEqual('function');
    expect(typeof DibPermissionError).toEqual('function');
    expect(typeof GiftAlreadyDibbedError).toEqual('function');

    let err = new UserNotFoundError();
    expect(err.code).toEqual(200);
    expect(err.status).toEqual(400);

    err = new UserValidationError();
    expect(err.code).toEqual(201);
    expect(err.status).toEqual(400);

    err = new WishListNotFoundError();
    expect(err.code).toEqual(300);
    expect(err.status).toEqual(400);

    err = new WishListValidationError();
    expect(err.code).toEqual(301);
    expect(err.status).toEqual(400);

    err = new GiftNotFoundError();
    expect(err.code).toEqual(400);
    expect(err.status).toEqual(400);

    err = new GiftValidationError();
    expect(err.code).toEqual(401);
    expect(err.status).toEqual(400);

    err = new DibNotFoundError();
    expect(err.code).toEqual(500);
    expect(err.status).toEqual(400);

    err = new DibValidationError();
    expect(err.code).toEqual(501);
    expect(err.status).toEqual(400);

    err = new DibPermissionError();
    expect(err.code).toEqual(502);
    expect(err.status).toEqual(403);

    err = new GiftAlreadyDibbedError();
    expect(err.code).toEqual(503);
    expect(err.status).toEqual(400);
  });
});

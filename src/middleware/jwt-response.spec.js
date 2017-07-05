const jwt = require('jsonwebtoken');

describe('jwt response middleware', () => {
  let originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should send a jwt with the request', () => {
    spyOn(jwt, 'sign').and.returnValue('token');
    const middleware = require('./jwt-response');
    const req = {
      user: {
        _id: 0
      }
    };
    const res = {
      json: (obj) => {
        expect(obj.token).toEqual('token');
      }
    };
    const next = () => {};
    middleware(req, res, next);
  });

  it('should use the user id and session secret to sign the jwt', () => {
    spyOn(jwt, 'sign').and.callFake((payload, secret, options) => {
      expect(payload.id).toEqual(0);

      expect(secret).toEqual('secret');

      expect(options.expiresIn).toEqual('1d');
    });
    process.env.JWT_SECRET = 'secret';
    const middleware = require('./jwt-response');
    const req = {
      user: { _id: 0 }
    };
    const res = {
      json: () => {}
    };
    const next = () => {};
    middleware(req, res, next);
  });

  it('should pass an error into the callback if the user is not attached to the session', () => {
    const middleware = require('./jwt-response');
    const req = {};
    const next = (err) => {
      expect(err).toBeDefined();
    };
    middleware(req, null, next);
  });
});

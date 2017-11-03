const mock = require('mock-require');
const jwt = require('jsonwebtoken');

describe('auth response middleware', () => {
  let originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('should send a jwt with the request', () => {
    spyOn(jwt, 'sign').and.returnValue('token');

    const middleware = mock.reRequire('./auth-response');
    const req = {
      user: {
        _id: 0
      }
    };
    const res = {
      json: (obj) => {
        expect(obj.authResponse.token).toEqual('token');
        expect(obj.authResponse.user).toBeDefined();
      }
    };
    const next = () => {};

    middleware()(req, res, next);
  });

  it('should use the user id and session secret to sign the jwt', () => {
    spyOn(jwt, 'sign').and.callFake((payload, secret, options) => {
      expect(payload.id).toEqual(0);
      expect(secret).toEqual('secret');
      expect(options.expiresIn).toEqual('15m');
    });

    process.env.JWT_SECRET = 'secret';

    const middleware = mock.reRequire('./auth-response');
    const req = {
      user: { _id: 0 }
    };
    const res = {
      json: () => {}
    };
    const next = () => {};

    middleware()(req, res, next);
  });

  it('should not attach auth information to the response if the session user does not exist', () => {
    const middleware = mock.reRequire('./auth-response');
    const req = {};
    const next = () => {};
    middleware()(req, {
      json: (obj) => {
        expect(obj.authResponse).toBeUndefined();
      }
    }, next);
  });
});

const mock = require('mock-require');

describe('authenticate-jwt middleware', () => {
  afterEach(() => {
    mock.stopAll();
  });

  it('should authenticate a jwt', (done) => {
    const passport = mock.reRequire('passport');
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = {};
      const info = {};
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const middleware = mock.reRequire('./authenticate-jwt');
    const req = {};
    middleware(req, {}, () => {
      expect(req.user).toBeDefined();
      done();
    });
  });

  it('should handle passport errors', (done) => {
    const passport = mock.reRequire('passport');
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = new Error();
      const user = null;
      const info = {};
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const middleware = mock.reRequire('./authenticate-jwt');
    const req = {};
    middleware(req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should handle jwt errors', (done) => {
    const passport = mock.reRequire('passport');
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = null;
      const info = { name: 'JsonWebTokenError' };
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const middleware = mock.reRequire('./authenticate-jwt');
    const req = {};
    middleware(req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.message).toEqual('Invalid access token.');
      expect(err.status).toEqual(401);
      expect(err.code).toEqual(111);
      done();
    });
  });

  it('should handle jwt expired errors', (done) => {
    const passport = mock.reRequire('passport');
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = null;
      const info = { name: 'TokenExpiredError' };
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const middleware = mock.reRequire('./authenticate-jwt');
    const req = {};
    middleware(req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.message).toEqual('Access token has expired.');
      expect(err.status).toEqual(401);
      expect(err.code).toEqual(111);
      done();
    });
  });

  it('should handle other errors', (done) => {
    const passport = mock.reRequire('passport');
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = null;
      const info = { name: 'Error', message: 'Invalid.' };
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const middleware = mock.reRequire('./authenticate-jwt');
    const req = {};
    middleware(req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.message).toEqual('Invalid.');
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(111);
      done();
    });
  });
});

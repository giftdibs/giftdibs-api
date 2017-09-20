const mock = require('mock-require');

describe('jwt passport strategy', () => {
  let originalSecret = process.env.JWT_SECRET;
  let mockExec = () => {};
  let _findQuery;

  beforeEach(() => {
    mock('../database/models/user', {
      find: (query) => {
        _findQuery = query;
        return {
          limit: () => mockExec()
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
    process.env.JWT_SECRET = originalSecret;
  });

  it('should derive the jwt from the authorization header', () => {
    let _called = false;
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {
          _called = true;
        }
      },
      Strategy: function MockStrategy() {}
    });
    mock.reRequire('./jwt');
    expect(_called).toEqual(true);
  });

  it('should derive the jwt secret from process.env', () => {
    let _config;
    process.env.JWT_SECRET = 'secret';
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {}
      },
      Strategy: function MockStrategy(config) {
        _config = config;
      }
    });
    mock.reRequire('./jwt');
    expect(_config.secretOrKey).toEqual('secret');
  });

  it('should authenticate a user from the jwt payload', (done) => {
    const mockUser = {};
    mockExec = () => Promise.resolve([ mockUser ]);
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {}
      },
      Strategy: function MockStrategy(config, verify) {
        verify({}, { id: 0 }, (err, user, info) => {
          expect(_findQuery._id).toEqual(0);
          expect(err).toBeUndefined();
          expect(user).toBeDefined();
          done();
        });
      }
    });
    mock.reRequire('./jwt');
  });

  it('should handle an invalid token', (done) => {
    mockExec = () => Promise.resolve([]);
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {}
      },
      Strategy: function MockStrategy(config, verify) {
        verify({}, { id: 0 }, (err, user, info) => {
          expect(_findQuery._id).toEqual(0);
          expect(err).toBeUndefined();
          expect(user).toEqual(false);
          expect(info.message).toEqual('A user was not found that matched that access token.');
          done();
        });
      }
    });
    mock.reRequire('./jwt');
  });

  it('should handle mongoose errors', (done) => {
    mockExec = () => Promise.reject(new Error());
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {}
      },
      Strategy: function MockStrategy(config, verify) {
        verify({}, { id: 0 }, (err) => {
          expect(err).toBeDefined();
          done();
        });
      }
    });
    mock.reRequire('./jwt');
  });

  it('should attach the authenticated user model to the request object', (done) => {
    const mockUser = {};
    mockExec = () => Promise.resolve([ mockUser ]);
    mock('passport-jwt', {
      ExtractJwt: {
        fromAuthHeaderWithScheme: () => {}
      },
      Strategy: function MockStrategy(config, verify) {
        let req = {};
        verify(req, { id: 0 }, (err) => {
          expect(err).toBeUndefined();
          expect(req.user).toBeDefined();
          done();
        });
      }
    });
    mock.reRequire('./jwt');
  });
});

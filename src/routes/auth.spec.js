const mock = require('mock-require');

describe('/auth', () => {
  let passport;

  beforeEach(() => {
    passport = mock.reRequire('passport');
    mock('../middleware/jwt-response', function jwtResponse() {});
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should login a user and return a jwt', (done) => {
    spyOn(passport, 'authenticate').and.callThrough();
    const auth = mock.reRequire('./auth');

    let spy = {
      jwtResponse: auth.middleware.login[2]
    };
    spyOn(spy, 'jwtResponse').and.callFake(() => {});

    expect(auth.middleware.login[0].name).toEqual('checkEmptyCredentials');
    expect(auth.middleware.login[1].name).toEqual('authenticate');
    expect(auth.middleware.login[2].name).toEqual('jwtResponse');

    auth.middleware.login[1]({}, {}, () => {
      expect(passport.authenticate).toHaveBeenCalled();
      done();
    });
  });

  it('should fail login if credentials are empty', (done) => {
    const auth = mock.reRequire('./auth');
    auth.middleware.login[0]({ body: {} }, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(100);

      const body = {
        emailAddress: 'a',
        password: 'b'
      };
      auth.middleware.login[0]({ body }, {}, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });
  });

  it('should login and add the user to the request object', (done) => {
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = {};
      const info = {};
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const auth = mock.reRequire('./auth');
    const req = { body: {} };
    const authenticate = auth.middleware.login[1];

    authenticate(req, {}, () => {
      expect(req.user).toBeDefined();
      done();
    });
  });

  it('should handle passport failures', (done) => {
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = new Error();
      const user = {};
      const info = {};
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const auth = mock.reRequire('./auth');
    const req = { body: {} };
    const authenticate = auth.middleware.login[1];

    authenticate(req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should handle user not found errors', (done) => {
    spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
      const err = null;
      const user = false;
      const info = {};
      callback(err, user, info);
      return (req, res, next) => {};
    });

    const auth = mock.reRequire('./auth');
    const req = { body: {} };
    const authenticate = auth.middleware.login[1];

    authenticate(req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(101);
      done();
    });
  });

  it('should register a user', (done) => {
    mock('../database/models/user', function User() {
      return {
        setPassword: () => Promise.resolve(),
        save: () => Promise.resolve({ _id: 0 })
      };
    });
    const auth = mock.reRequire('./auth');
    const register = auth.middleware.register;
    const req = {
      body: {
        firstName: '',
        lastName: '',
        emailAddress: '',
        password: ''
      }
    };
    const res = {
      json: (result) => {
        expect(result.id).toEqual(0);
        done();
      }
    };
    register[0](req, res, () => {});
  });

  it('should fail registration if schema validation fails', (done) => {
    mock('../database/models/user', function User() {
      return {
        setPassword: () => {
          const error = new Error();
          error.name = 'ValidationError';
          return Promise.reject(error);
        }
      };
    });
    const auth = mock.reRequire('./auth');
    const register = auth.middleware.register;
    const req = {
      body: {
        firstName: '',
        lastName: '',
        emailAddress: '',
        password: ''
      }
    };
    const res = {};
    register[0](req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(102);
      done();
    });
  });

  it('should fail registration if mongoose fails', (done) => {
    mock('../database/models/user', function User() {
      return {
        setPassword: () => Promise.reject(new Error())
      };
    });
    const auth = mock.reRequire('./auth');
    const register = auth.middleware.register;
    const req = {
      body: {
        firstName: '',
        lastName: '',
        emailAddress: '',
        password: ''
      }
    };
    const res = {};
    register[0](req, res, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should create a reset password token', (done) => {
    const _user = {
      save: () => Promise.resolve()
    };
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => Promise.resolve([_user])
        };
      }
    });
    const auth = mock.reRequire('./auth');
    const forgotten = auth.middleware.forgotten;
    const req = {
      body: {
        emailAddress: ''
      }
    };
    const res = {
      json: () => {
        expect(typeof _user.resetPasswordToken).toEqual('string');
        expect(typeof _user.resetPasswordExpires).toEqual('number');
        done();
      }
    };
    forgotten[0](req, res, () => {});
  });

  it('should handle errors finding a user for a reset password token', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => Promise.resolve([])
        };
      }
    });
    const auth = mock.reRequire('./auth');
    const forgotten = auth.middleware.forgotten;
    const req = {
      body: {
        emailAddress: ''
      }
    };
    forgotten[0](req, {}, (err) => {
      expect(err.code).toEqual(104);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('should reset a password', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: ''
      },
      user: {
        resetPasswordToken: 'foo',
        resetPasswordExpires: 123,
        setPassword: () => Promise.resolve(),
        save: () => Promise.resolve()
      }
    };
    const res = {
      json: () => {
        expect(req.user.resetPasswordToken).toBeUndefined();
        expect(req.user.resetPasswordExpires).toBeUndefined();
        done();
      }
    };
    resetPassword[3](req, res, () => {});
  });

  it('should validate a token before resetting the password', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => Promise.resolve([{ firstName: 'Foo' }])
        };
      }
    });
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        resetPasswordToken: 'abc123',
        resetPasswordExpires: 0
      }
    };
    resetPassword[2](req, {}, (err) => {
      expect(err).toBeUndefined();
      expect(req.user).toBeDefined();
      expect(req.user.firstName).toEqual('Foo');
      done();
    });
  });

  it('should skip validation of token if user already set in the session', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      user: {}
    };
    resetPassword[2](req, {}, (err) => {
      expect(err).toBeUndefined();
      expect(req.user).toBeDefined();
      done();
    });
  });

  it('should validate a jwt before resetting the password', (done) => {
    spyOn(passport, 'authenticate').and.callFake((hook, options) => {
      return (req, res, next) => {
        next();
      };
    });
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      headers: {
        authorization: 'JWT abc123'
      }
    };
    resetPassword[1](req, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('should skip validate a jwt before resetting the password if headers not set', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      headers: {
        authorization: ''
      }
    };
    resetPassword[1](req, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('should check if the password is empty, or does not match, before a reset password request', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: 'foo',
        passwordAgain: 'foo'
      }
    };
    resetPassword[0](req, {}, (err) => {
      expect(err).toBeUndefined();
    });
  });

  it('should fail reset password if password is empty', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {}
    };
    resetPassword[0](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(107);
    });
  });

  it('should fail reset password if passwords do not match', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: 'foo',
        passwordAgain: 'bar'
      }
    };
    resetPassword[0](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(105);
    });
  });

  it('should fail reset password if the jwt is invalid', (done) => {
    spyOn(passport, 'authenticate').and.callFake((hook, options) => {
      return (req, res, next) => {
        next(new Error());
      };
    });
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      headers: {
        authorization: 'JWT abc123'
      }
    };
    resetPassword[1](req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should fail reset password if the token is not sent with the request', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {}
    };
    resetPassword[2](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(106);
      done();
    });
  });

  it('should fail reset password if the token is not found on a user record', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => Promise.resolve([])
        };
      }
    });
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        resetPasswordToken: 'abc123',
        resetPasswordExpires: 0
      }
    };
    resetPassword[2](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(106);
      done();
    });
  });

  it('should fail reset password if the new password fails validation', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: ''
      },
      user: {
        setPassword: () => {
          const err = new Error();
          err.name = 'ValidationError';
          return Promise.reject(err);
        }
      }
    };
    resetPassword[3](req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(107);
      done();
    });
  });

  it('should fail reset password if any other errors are thrown', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: ''
      },
      user: {
        setPassword: () => Promise.reject(new Error())
      }
    };
    resetPassword[3](req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

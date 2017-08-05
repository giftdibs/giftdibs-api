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

  it('login - should login a user and return a jwt', (done) => {
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
      expect(passport.authenticate).toHaveBeenCalledWith('local', jasmine.any(Function));
      done();
    });
  });

  it('login - should fail login if credentials are empty', (done) => {
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

  it('login - should login and add the user to the request object', (done) => {
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

  it('login - should handle passport failures', (done) => {
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

  it('login - should handle user not found errors', (done) => {
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

  it('register - should register a user', (done) => {
    mock('../database/models/user', function User() {
      return {
        setPassword: () => Promise.resolve(),
        resetEmailAddressVerification: () => {},
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
    register[1](req, res, () => {});
  });

  it('register - should fail registration if schema validation fails', (done) => {
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
    register[1](req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(102);
      done();
    });
  });

  it('register - should fail registration if mongoose fails', (done) => {
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
    register[1](req, res, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('register - should fail registration if gdNickname is included in the request', (done) => {
    // Spam bot control.
    const auth = mock.reRequire('./auth');
    const register = auth.middleware.register;
    const req = {
      body: {
        gdNickname: 'dick'
      }
    };
    register[0](req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(108);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('register - should continue registration if gdNickname is undefined', (done) => {
    // Spam bot control.
    const auth = mock.reRequire('./auth');
    const register = auth.middleware.register;
    const req = {
      body: {}
    };
    register[0](req, {}, (err) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('forgotten - should create a reset password token', (done) => {
    const _user = {
      save: () => Promise.resolve(),
      setResetPasswordToken: () => {}
    };
    spyOn(_user, 'setResetPasswordToken').and.callThrough();
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
        expect(_user.setResetPasswordToken).toHaveBeenCalledWith();
        done();
      }
    };
    forgotten[1](req, res, () => {});
  });

  it('forgotten - should fail if email is empty', () => {
    const auth = mock.reRequire('./auth');
    const forgotten = auth.middleware.forgotten;
    const req = {
      body: {}
    };
    forgotten[0](req, {}, (err) => {
      expect(err.message).toBeDefined();
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(104);
    });
  });

  it('forgotten - should continue if email is not empty', () => {
    const auth = mock.reRequire('./auth');
    const forgotten = auth.middleware.forgotten;
    const req = {
      body: {
        emailAddress: 'foo@bar.com'
      }
    };
    forgotten[0](req, {}, (err) => {
      expect(err).not.toBeDefined();
    });
  });

  it('forgotten - should handle errors finding a user for a reset password token', (done) => {
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
    forgotten[1](req, {}, (err) => {
      expect(err.code).toEqual(104);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('reset-password - should reset a password', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        password: ''
      },
      user: {
        setPassword: () => Promise.resolve(),
        save: () => Promise.resolve(),
        unsetResetPasswordToken: () => {}
      }
    };
    const res = {
      json: () => {
        expect(req.user.unsetResetPasswordToken).toHaveBeenCalledWith();
        done();
      }
    };
    spyOn(req.user, 'unsetResetPasswordToken').and.callThrough();
    resetPassword[3](req, res, () => {});
  });

  it('reset-password - should validate a token before resetting the password', (done) => {
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

  it('reset-password - should skip validation of token if user already set in the session', (done) => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      user: {
        validatePassword: () => Promise.resolve()
      },
      body: {}
    };
    resetPassword[2](req, {}, (err) => {
      expect(err).toBeUndefined();
      expect(req.user).toBeDefined();
      done();
    });
  });

  it('reset-password - should validate a jwt before resetting the password', (done) => {
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

  it('reset-password - should skip validate a jwt before resetting the password if headers not set', (done) => {
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

  it('reset-password - should check if the password is empty, or does not match, before a reset password request', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        resetPasswordToken: 'abc123',
        password: 'foo',
        passwordAgain: 'foo'
      }
    };
    resetPassword[0](req, {}, (err) => {
      expect(err).toBeUndefined();
    });
  });

  it('reset-password - should fail reset password if password is empty', () => {
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

  it('reset-password - should fail reset password if passwords do not match', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        resetPasswordToken: 'abc123',
        password: 'foo',
        passwordAgain: 'bar'
      }
    };
    resetPassword[0](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(105);
    });
  });

  it('reset-password - should fail if password fields are empty', () => {
    const auth = mock.reRequire('./auth');
    const resetPassword = auth.middleware.resetPassword;
    const req = {
      body: {
        resetPasswordToken: 'abc123',
        password: '',
        passwordAgain: ''
      }
    };
    resetPassword[0](req, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(107);
    });
  });

  it('reset-password - should fail reset password if the jwt is invalid', (done) => {
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

  it('reset-password - should fail reset password if the token is not sent with the request', (done) => {
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

  it('reset-password - should fail reset password if the token is not found on a user record', (done) => {
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

  it('reset-password - should fail reset password if the new password fails validation', (done) => {
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

  it('reset-password - should fail reset password if any other errors are thrown', (done) => {
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

  it('resend-email-address-verification - should require a jwt before getting reset email verification token', () => {
    const auth = mock.reRequire('./auth');
    const resendEmailAddressVerification = auth.middleware.resendEmailAddressVerification;
    expect(resendEmailAddressVerification[0].name).toEqual('authenticateJwt');
    spyOn(passport, 'authenticate').and.returnValue(() => {});
    resendEmailAddressVerification[0]({}, {}, () => {});
    expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false });
  });

  it('resend-email-address-verification - should reset email verification token', (done) => {
    const auth = mock.reRequire('./auth');
    const resendEmailAddressVerification = auth.middleware.resendEmailAddressVerification;
    const req = {
      user: {
        resetEmailAddressVerification: () => {},
        save: () => Promise.resolve()
      }
    };
    const res = {
      json: () => {
        expect(req.user.resetEmailAddressVerification).toHaveBeenCalledWith();
        done();
      }
    };
    spyOn(req.user, 'resetEmailAddressVerification').and.callThrough();
    resendEmailAddressVerification[1](req, res, () => {});
  });

  it('verify-email - should require a jwt before verifying email address', () => {
    const auth = mock.reRequire('./auth');
    const verifyEmailAddress = auth.middleware.verifyEmailAddress;
    expect(verifyEmailAddress[0].name).toEqual('authenticateJwt');
    spyOn(passport, 'authenticate').and.returnValue(() => {});
    const req = {
      body: {
        emailAddressVerificationToken: 'abc123'
      }
    };
    verifyEmailAddress[0](req, {}, () => {});
    expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false });
  });

  it('verify-email - should verify an email address', (done) => {
    const auth = mock.reRequire('./auth');
    const verifyEmailAddress = auth.middleware.verifyEmailAddress;
    const req = {
      user: {
        verifyEmailAddress: () => true,
        save: () => Promise.resolve()
      },
      body: {
        emailAddressVerificationToken: 'abc123'
      }
    };
    const res = {
      json: () => {
        expect(req.user.verifyEmailAddress).toHaveBeenCalledWith('abc123');
        done();
      }
    };
    spyOn(req.user, 'verifyEmailAddress').and.callThrough();
    verifyEmailAddress[1](req, res, () => {});
  });

  it('verify-email - should handle unverified email address', (done) => {
    const auth = mock.reRequire('./auth');
    const verifyEmailAddress = auth.middleware.verifyEmailAddress;
    const req = {
      user: {
        verifyEmailAddress: () => false,
        save: () => Promise.resolve()
      },
      body: {
        emailAddressVerificationToken: 'abc123'
      }
    };
    const res = {};
    spyOn(req.user, 'verifyEmailAddress').and.callThrough();
    verifyEmailAddress[1](req, res, (err) => {
      expect(err.status).toEqual(400);
      expect(err.code).toEqual(109);
      done();
    });
  });
});

const mock = require('mock-require');

describe('Auth router', () => {
  let passport;

  beforeEach(() => {
    mock('../middleware/auth-response', (data) => {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });

    passport = mock.reRequire('passport');
  });

  afterEach(() => {
    mock.stopAll();
  });

  describe('login', () => {
    it('should login a user and return a jwt', (done) => {
      spyOn(passport, 'authenticate').and.callFake((hook, callback) => {
        const err = null;
        const user = {};
        const info = {};
        callback(err, user, info);
        return (req, res, next) => {};
      });

      const auth = mock.reRequire('./auth');

      expect(auth.middleware.login[0].name).toEqual('checkEmptyCredentials');
      expect(auth.middleware.login[1].name).toEqual('authenticate');

      const res = {
        json: (data) => {
          expect(passport.authenticate)
            .toHaveBeenCalledWith('local', jasmine.any(Function));
          expect(data.authResponse).toBeDefined();
          done();
        }
      };

      auth.middleware.login[1]({}, res, () => {});
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

      authenticate(req, {
        json: (data) => {
          expect(req.user).toBeDefined();
          done();
        }
      }, () => {});
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
  });

  describe('register', () => {
    it('should register a user', (done) => {
      function User() {
        return {
          setPassword: () => Promise.resolve(),
          resetEmailAddressVerification: () => {},
          save: () => Promise.resolve({ _id: 0 })
        };
      }

      mock('../database/models/user', { User });

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

    it('should fail registration if schema validation fails', (done) => {
      function User() {
        return {
          setPassword: () => {
            const error = new Error();
            error.name = 'ValidationError';
            return Promise.reject(error);
          }
        };
      }

      mock('../database/models/user', { User });

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

    it('should fail registration if mongoose fails', (done) => {
      function User() {
        return {
          setPassword: () => Promise.reject(new Error())
        };
      }

      mock('../database/models/user', { User });

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

    it('should fail registration if nickname included in request', (done) => {
      // Spam bot control.
      const auth = mock.reRequire('./auth');
      const register = auth.middleware.register;
      const req = {
        body: {
          gdNickname: 'bot'
        }
      };
      register[0](req, {}, (err) => {
        expect(err).toBeDefined();
        expect(err.code).toEqual(108);
        expect(err.status).toEqual(400);
        done();
      });
    });

    it('should continue registration if gdNickname is undefined', (done) => {
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
  });

  describe('forgotten', () => {
    it('should create a reset password token', (done) => {
      const _user = {
        save: () => Promise.resolve(),
        setResetPasswordToken: () => {}
      };
      spyOn(_user, 'setResetPasswordToken').and.callThrough();
      mock('../database/models/user', {
        User: {
          find: () => {
            return {
              limit: () => Promise.resolve([_user])
            };
          }
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

    it('should fail if email is empty', () => {
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

    it('should continue if email is not empty', () => {
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

    it('should handle errors finding user for reset password token', (done) => {
      mock('../database/models/user', {
        User: {
          find: () => {
            return {
              limit: () => Promise.resolve([])
            };
          }
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
  });

  describe('resend-email-address-verification', () => {
    it('should require jwt when getting reset email verification token', () => {
      const auth = mock.reRequire('./auth');
      expect(auth.middleware.resendEmailAddressVerification[0].name)
        .toEqual('authenticateJwt');
    });

    it('should reset email verification token', (done) => {
      const auth = mock.reRequire('./auth');
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
      auth.middleware.resendEmailAddressVerification[1](req, res, () => {});
    });
  });

  describe('verify-email', () => {
    it('should require a jwt before verifying email address', () => {
      const auth = mock.reRequire('./auth');
      const verifyEmailAddress = auth.middleware.verifyEmailAddress;
      expect(verifyEmailAddress[0].name).toEqual('authenticateJwt');
    });

    it('should verify an email address', (done) => {
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

    it('should handle empty token', (done) => {
      const auth = mock.reRequire('./auth');
      const verifyEmailAddress = auth.middleware.verifyEmailAddress;

      const req = {
        user: {},
        body: {
          emailAddressVerificationToken: undefined
        }
      };

      const res = {};

      verifyEmailAddress[1](req, res, (err) => {
        expect(err.name).toEqual('EmailVerificationTokenValidationError');
        expect(err.message).toEqual('Please provide an email address verification token.');
        done();
      });
    });

    it('should handle unverified email address', (done) => {
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
        expect(err.name).toEqual('EmailVerificationTokenValidationError');
        expect(err.message).toEqual(
          'The email address verification token is invalid or has expired.'
        );
        done();
      });
    });
  });

  describe('reset-password', () => {
    let _req;
    let _user;

    beforeEach(() => {
      passport = mock.reRequire('passport');
      _user = {
        setPassword: () => Promise.resolve(_req.user),
        save: () => Promise.resolve(),
        unsetResetPasswordToken: () => {},
        confirmPassword: () => Promise.resolve()
      };
      _req = {
        body: {},
        user: _user
      };
    });

    afterEach(() => {
      mock.stopAll();
    });

    it('should reset a password', (done) => {
      mock('../database/models/user', {
        User: {
          find: () => {
            return {
              limit: () => Promise.resolve([_user])
            };
          }
        }
      });

      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;
      const unsetTokenSpy = spyOn(_req.user, 'unsetResetPasswordToken')
        .and.callThrough();
      const confirmPasswordSpy = spyOn(_req.user, 'confirmPassword')
        .and.callThrough();
      const setPasswordSpy = spyOn(_req.user, 'setPassword')
        .and.callThrough();

      _req.body.currentPassword = 'oldpassword';
      _req.body.password = 'newpassword';

      const res = {
        json: () => {
          expect(unsetTokenSpy).toHaveBeenCalledWith();
          expect(confirmPasswordSpy)
            .toHaveBeenCalledWith(_req.body.currentPassword);
          expect(setPasswordSpy).toHaveBeenCalledWith(_req.body.password);
          done();
        }
      };

      resetPassword[2](_req, res, () => { });
    });

    it('should validate a token before resetting the password', (done) => {
      let _query;

      const MockUser = {
        User: {
          find: (query) => {
            _query = query;
            return {
              limit: () => Promise.resolve([_user])
            };
          }
        }
      };

      mock('../database/models/user', MockUser);

      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body = {
        resetPasswordToken: 'abc123',
        resetPasswordExpires: 0
      };

      const res = {
        json: () => {
          expect(_query.resetPasswordToken)
            .toEqual(_req.body.resetPasswordToken);
          expect(_query.resetPasswordExpires).toBeDefined();
          done();
        }
      };

      resetPassword[2](_req, res, () => { });
    });

    it('should validate jwt before resetting the password (if token not set)',
      (done) => {
        let authJwtCalled = false;

        mock('../middleware/authenticate-jwt', (req, res, next) => {
          authJwtCalled = true;
          next();
        });

        const auth = mock.reRequire('./auth');
        const resetPassword = auth.middleware.resetPassword;

        resetPassword[1](_req, {}, (err) => {
          expect(err).toBeUndefined();
          expect(authJwtCalled).toEqual(true);
          done();
        });
      }
    );

    it('should not validate jwt if reset password token set', (done) => {
      let authJwtCalled = false;

      mock('../middleware/authenticate-jwt', (req, res, next) => {
        authJwtCalled = true;
        next();
      });

      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body.resetPasswordToken = 'token';

      resetPassword[1](_req, {}, (err) => {
        expect(err).toBeUndefined();
        expect(authJwtCalled).toEqual(false);
        done();
      });
    });

    it('should check if the password is empty, or does not match', () => {
      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body = {
        resetPasswordToken: 'abc123',
        password: 'foo',
        passwordAgain: 'foo'
      };

      resetPassword[0](_req, {}, (err) => {
        expect(err).toBeUndefined();
      });
    });

    it('should fail if password is empty', () => {
      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      resetPassword[0](_req, {}, (err) => {
        expect(err.name).toEqual('ResetPasswordValidationError');
        expect(err.message).toEqual('Please provide your current password.');
      });
    });

    it('should fail if passwords do not match', () => {
      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body = {
        resetPasswordToken: 'abc123',
        password: 'foo',
        passwordAgain: 'bar'
      };

      resetPassword[0](_req, {}, (err) => {
        expect(err.name).toEqual('ResetPasswordValidationError');
        expect(err.message).toEqual('The passwords you typed do not match.');
      });
    });

    it('should fail if password fields are empty', () => {
      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;
      _req.body = {
        resetPasswordToken: 'abc123',
        password: '',
        passwordAgain: ''
      };
      resetPassword[0](_req, {}, (err) => {
        expect(err.name).toEqual('ResetPasswordValidationError');
        expect(err.message).toEqual('Please provide a new password.');
      });
    });

    it('should fail if the jwt is invalid', (done) => {
      spyOn(passport, 'authenticate').and.callFake((hook, options) => {
        return (req, res, next) => {
          next(new Error());
        };
      });

      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.headers = {
        authorization: 'JWT abc123'
      };

      resetPassword[1](_req, {}, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });

    it('should fail if the token is not found on a user record', (done) => {
      mock('../database/models/user', {
        User: {
          find: () => {
            return {
              limit: () => Promise.resolve([])
            };
          }
        }
      });

      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body = {
        resetPasswordToken: 'abc123',
        resetPasswordExpires: 0
      };

      resetPassword[2](_req, {}, (err) => {
        expect(err.name).toEqual('ResetPasswordTokenValidationError');
        done();
      });
    });

    it('should fail reset password if the new password invalid', (done) => {
      const auth = mock.reRequire('./auth');
      const resetPassword = auth.middleware.resetPassword;

      _req.body = {
        password: ''
      };

      _req.user.setPassword = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };

      resetPassword[2](_req, {}, (err) => {
        expect(err.name).toEqual('ResetPasswordValidationError');
        done();
      });
    });
  });
});

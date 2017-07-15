const mock = require('mock-require');
// const passport = require('passport');

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
});

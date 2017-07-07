const passport = require('passport');
const mock = require('mock-require');

describe('/auth', () => {
  beforeEach(() => {
    mock('../middleware/jwt-response', function jwtResponse() {});
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should login a user and return a jwt', () => {
    spyOn(passport, 'authenticate').and.callThrough();
    const auth = mock.reRequire('./auth');
    expect(auth.middleware.login[0].name).toEqual('authenticate');
    expect(auth.middleware.login[1].name).toEqual('jwtResponse');
    expect(passport.authenticate).toHaveBeenCalledWith('local', { session: false });
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

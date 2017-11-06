const mock = require('mock-require');

describe('Auth Facebook router', () => {
  let _findCallback;
  let facebook;

  function getCallback(query) {
    return _findCallback(query);
  }

  class MockUser {
    constructor(options) {
      Object.assign(this, options);
    }

    static find(query) {
      return {
        limit: () => getCallback(query)
      };
    }
  }

  MockUser.prototype.save = function () {
    return Promise.resolve();
  };

  MockUser.prototype.setPassword = function () {
    return Promise.resolve();
  };

  beforeEach(() => {
    facebook = mock.reRequire('../lib/facebook');
    _findCallback = (query) => {
      const docs = [];
      docs.push(new MockUser());
      return Promise.resolve(docs);
    };
    mock('../middleware/auth-response', () => {});
    mock('../database/models/user', { User: MockUser });
    spyOn(facebook, 'verifyUserAccessToken').and.returnValue(Promise.resolve({
      data: {
        user_id: '0'
      }
    }));
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should log a user in using a facebook user access token', () => {
    spyOn(facebook, 'getProfile').and.returnValue(Promise.resolve({
      email: 'foo@bar.com'
    }));

    const route = mock.reRequire('./auth-facebook');
    const loginFacebook = route.middleware.loginFacebook;
    const req = {
      body: {
        facebookUserAccessToken: 'abc123'
      }
    };
    const res = {
      json: (data) => {
        expect(req.user).toBeDefined();
        expect(req.user.dateLastLoggedIn).toBeDefined();
        expect(data.authResponse).toBeDefined();
        expect(data.authResponse.token).toBeDefined();
      }
    };
    loginFacebook[0](req, res, () => {});
  });

  it('should log a user in using a facebook email address (and token)', () => {
    spyOn(facebook, 'getProfile').and.returnValue(Promise.resolve({
      email: 'foo@bar.com'
    }));

    _findCallback = (query) => {
      if (query.facebookId) {
        return Promise.resolve([]);
      }

      return Promise.resolve([new MockUser()]);
    };

    const route = mock.reRequire('./auth-facebook');
    const loginFacebook = route.middleware.loginFacebook;
    const req = {
      body: {
        facebookUserAccessToken: 'abc123'
      }
    };
    const res = {
      json: (data) => {
        expect(req.user).toBeDefined();
        expect(req.user.dateLastLoggedIn).toBeDefined();
      }
    };
    loginFacebook[0](req, res, () => {});
  });

  it('should register a new user with facebook profile', () => {
    spyOn(facebook, 'getProfile').and.returnValue(Promise.resolve({
      first_name: '',
      last_name: '',
      email: 'foo@bar.com',
      id: '0'
    }));

    _findCallback = (query) => {
      return Promise.resolve([]);
    };

    const route = mock.reRequire('./auth-facebook');
    const loginFacebook = route.middleware.loginFacebook;
    const req = {
      body: {
        facebookUserAccessToken: 'abc123'
      }
    };
    const res = {
      json: (data) => {
        expect(req.user).toBeDefined();
        expect(req.user.dateLastLoggedIn).toBeDefined();
        expect(req.user.emailAddressVerified).toEqual(true);
      }
    };
    loginFacebook[0](req, res, () => {});
  });

  it('should handle validation errors from facebook profile', () => {
    MockUser.prototype.save = function () {
      const err = new Error('Invalid');
      err.name = 'ValidationError';
      return Promise.reject(err);
    };
    spyOn(facebook, 'getProfile').and.returnValue(Promise.resolve({
      first_name: '',
      last_name: '',
      email: 'foo@bar.com',
      id: '0'
    }));

    _findCallback = (query) => {
      return Promise.resolve([]);
    };

    const route = mock.reRequire('./auth-facebook');
    const loginFacebook = route.middleware.loginFacebook;
    const req = {
      body: {
        facebookUserAccessToken: 'abc123'
      }
    };
    loginFacebook[0](req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(110);
      expect(err.status).toEqual(400);
    });
  });

  it('should pass all other errors to the next middleware', () => {
    MockUser.prototype.setPassword = function () {
      return Promise.reject(new Error());
    };
    spyOn(facebook, 'getProfile').and.returnValue(Promise.resolve({
      first_name: '',
      last_name: '',
      email: 'foo@bar.com',
      id: '0'
    }));

    _findCallback = (query) => {
      return Promise.resolve([]);
    };

    const route = mock.reRequire('./auth-facebook');
    const loginFacebook = route.middleware.loginFacebook;
    const req = {
      body: {
        facebookUserAccessToken: 'abc123'
      }
    };
    loginFacebook[0](req, {}, (err) => {
      expect(err).toBeDefined();
    });
  });
});

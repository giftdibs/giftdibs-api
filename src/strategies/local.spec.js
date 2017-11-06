const mock = require('mock-require');

describe('local passport strategy', () => {
  let mockExec = () => {};

  beforeEach(() => {
    const mockUser = {
      find: () => {
        return {
          limit: () => mockExec()
        }
      }
    };
    mock('../database/models/user', { User: mockUser });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should change the "username" field', () => {
    let _config;
    mock('passport-local', {
      Strategy: function MockStrategy(config) {
        _config = config;
      }
    });
    require('./local');
    expect(_config.usernameField).toEqual('emailAddress');
  });

  it('should pass if the email address and password match a record', (done) => {
    const mockUser = {
      confirmPassword: () => Promise.resolve(),
      save: () => Promise.resolve()
    };
    mock('passport-local', {
      Strategy: function MockStrategy(config, verify) {
        verify('', '', (err, user, info) => {
          expect(err).toEqual(null);
          expect(user.dateLastLoggedIn).toBeDefined();
          done();
        });
      }
    });
    mockExec = () => Promise.resolve([ mockUser ]);
    mock.reRequire('./local');
  });

  it('should fail if the email address is not found', (done) => {
    mock('passport-local', {
      Strategy: function MockStrategy(config, verify) {
        verify('', '', (err, user, info) => {
          expect(err).toEqual(null);
          expect(user).toEqual(false);
          expect(info.message)
            .toEqual('A user with that email address was not found.');
          done();
        });
      }
    });
    mockExec = () => Promise.resolve([]);
    mock.reRequire('./local');
  });

  it('should fail if the password is invalid', (done) => {
    const mockUser = {
      confirmPassword: () => Promise.reject(new Error()),
      save: () => Promise.resolve()
    };
    mock('passport-local', {
      Strategy: function MockStrategy(config, verify) {
        verify('', '', (err, user, info) => {
          expect(err).toEqual(null);
          expect(user).toEqual(false);
          expect(info.message)
            .toEqual([
              'The email address and password you entered',
              'did not match an account in our records.'
            ].join(' '));
          done();
        });
      }
    });
    mockExec = () => Promise.resolve([ mockUser ]);
    mock.reRequire('./local');
  });

  it('should handle mongoose errors', (done) => {
    mock('passport-local', {
      Strategy: function MockStrategy(config, verify) {
        verify('', '', (err) => {
          expect(err).toBeDefined();
          done();
        });
      }
    });
    mockExec = () => Promise.reject(new Error());
    mock.reRequire('./local');
  });
});

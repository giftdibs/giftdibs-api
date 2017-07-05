const mock = require('mock-require');

describe('local passport strategy', () => {
  let context = {};
  let mockStrategy;

  beforeEach(() => {
    context = {};
    mockStrategy = function MockStrategy(config) {
      context.config = config;
    }
  });

  afterEach(() => {
    mock.stopAll();
    context = {};
  });

  it('should change the "username" field', () => {
    mock('passport-local', {
      Strategy: mockStrategy
    });
    require('./local');

    expect(context.config.usernameField).toEqual('emailAddress');
  });

  it('should pass if the email address and password match a record in the database', (done) => {
    const mockUser = {
      validatePassword: () => Promise.resolve(),
      save: () => Promise.resolve()
    };
    mock('passport-local', {
      Strategy: function MockStrategy(config, verify) {
        verify('', '', (err, user, info) => {
          if (!err) {
            expect(user.dateLastLoggedIn).toBeDefined();
          }

          done();
        });
      }
    });
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => {
            return {
              exec: () => Promise.resolve([ mockUser ])
            }
          }
        }
      }
    });
    mock.reRequire('./local');
  });

  it('should fail if the email address is not found', () => {});

  it('should fail if the password is invalid', () => {});

  it('should handle mongoose errors', () => {});

  it('should set the last logged in date on the user', () => {});
});

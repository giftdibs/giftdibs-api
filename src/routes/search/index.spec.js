const mock = require('mock-require');

describe('Users router', () => {
  beforeEach(() => {
    mock('./users', {
      searchUsers() {}
    });
    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const search = mock.reRequire('./index');
    expect(search.router.stack[0].name).toEqual('authenticateJwt');
  });
});

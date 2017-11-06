const mock = require('mock-require');

describe('Confirm user owns User object middleware', () => {
  let _req;

  beforeEach(() => {
    _req = {
      user: {
        _id: 'userid'
      },
      params: {
        userId: 'userid'
      }
    };
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should fail if the session does not own the resource', () => {
    const middleware = mock.reRequire('./confirm-user-owns-user');
    const next = (err) => {
      expect(err.name).toEqual('UserPermissionError');
    };

    _req.user._id = 'diffuserid';

    middleware(_req, null, next);
  });

  it('should fail if the session does not include a user', () => {
    const middleware = mock.reRequire('./confirm-user-owns-user');
    const next = (err) => {
      expect(err.name).toEqual('UserPermissionError');
    };

    _req.user = undefined;

    middleware(_req, null, next);
  });

  it('should continue if the session does own the resource', () => {
    const middleware = mock.reRequire('./confirm-user-owns-user');
    const next = (err) => {
      expect(err).toBeUndefined();
    };

    middleware(_req, null, next);
  });
});

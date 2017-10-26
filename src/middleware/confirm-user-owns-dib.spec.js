const mock = require('mock-require');

const {
  MockDib,
  MockRequest
} = mock.reRequire('../shared/testing');

describe('confirm user owns dib', () => {
  let _req;

  beforeEach(() => {
    MockDib.reset();

    mock('../database/models/dib', { Dib: MockDib });

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        dibId: 'dibid'
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should pass an error to the callback if the session does not own the resource', (done) => {
    const { confirmUserOwnsDib } = mock.reRequire('./confirm-user-owns-dib');

    MockDib.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'diffuserid'
    }]);

    const next = (err) => {
      expect(err.name).toEqual('DibPermissionError');
      done();
    };

    confirmUserOwnsDib(_req, null, next);
  });

  it('should continue if the session does own the resource', (done) => {
    const { confirmUserOwnsDib } = mock.reRequire('./confirm-user-owns-dib');

    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };

    MockDib.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'userid'
    }]);

    confirmUserOwnsDib(_req, null, next);
  });

  it('should handle errors', (done) => {
    const { confirmUserOwnsDib } = mock.reRequire('./confirm-user-owns-dib');

    MockDib.overrides.find.returnWith = () => Promise.reject(new Error());

    const next = (err) => {
      expect(err.name).toEqual('Error');
      done();
    };

    confirmUserOwnsDib(_req, null, next);
  });

  it('should handle wish list not found error', (done) => {
    const { confirmUserOwnsDib } = mock.reRequire('./confirm-user-owns-dib');

    MockDib.overrides.find.returnWith = () => Promise.resolve([]);

    const next = (err) => {
      expect(err.name).toEqual('DibNotFoundError');
      done();
    };

    confirmUserOwnsDib(_req, null, next);
  });

  it('should pass an error to the callback if the wish list ID is not provided', () => {
    const { confirmUserOwnsDib } = mock.reRequire('./confirm-user-owns-dib');

    _req.params.dibId = undefined;

    const next = (err) => {
      expect(err.name).toEqual('DibNotFoundError');
    };

    confirmUserOwnsDib(_req, null, next);
  });
});

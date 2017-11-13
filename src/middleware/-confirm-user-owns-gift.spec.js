const mock = require('mock-require');

const {
  MockGift,
  MockRequest
} = mock.reRequire('../shared/testing');

describe('Confirm user owns gift middleware', () => {
  let _req;

  beforeEach(() => {
    MockGift.reset();

    mock('../database/models/gift', { Gift: MockGift });

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        giftId: 'giftid'
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should fail if the session does not own the resource', (done) => {
    const { confirmUserOwnsGift } = mock.reRequire('./confirm-user-owns-gift');

    MockGift.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'diffuserid'
    }]);

    const next = (err) => {
      expect(err.name).toEqual('GiftPermissionError');
      done();
    };

    confirmUserOwnsGift(_req, null, next);
  });

  it('should continue if the session does own the resource', (done) => {
    const { confirmUserOwnsGift } = mock.reRequire('./confirm-user-owns-gift');

    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };

    MockGift.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'userid'
    }]);

    confirmUserOwnsGift(_req, null, next);
  });

  it('should handle errors', (done) => {
    const { confirmUserOwnsGift } = mock.reRequire('./confirm-user-owns-gift');

    MockGift.overrides.find.returnWith = () => Promise.reject(new Error());

    const next = (err) => {
      expect(err.name).toEqual('Error');
      done();
    };

    confirmUserOwnsGift(_req, null, next);
  });

  it('should handle gift not found error', (done) => {
    const { confirmUserOwnsGift } = mock.reRequire('./confirm-user-owns-gift');

    MockGift.overrides.find.returnWith = () => Promise.resolve([]);

    const next = (err) => {
      expect(err.name).toEqual('GiftNotFoundError');
      done();
    };

    confirmUserOwnsGift(_req, null, next);
  });

  it('should fail if the gift ID is not provided', () => {
    const { confirmUserOwnsGift } = mock.reRequire('./confirm-user-owns-gift');

    _req.params.giftId = undefined;

    const next = (err) => {
      expect(err.name).toEqual('GiftNotFoundError');
    };

    confirmUserOwnsGift(_req, null, next);
  });
});

const mock = require('mock-require');

const {
  MockFriendship,
  MockRequest
} = mock.reRequire('../shared/testing');

describe('Confirm user owns friendship middleware', () => {
  let _req;

  beforeEach(() => {
    MockFriendship.reset();

    mock('../database/models/friendship', { Friendship: MockFriendship });

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        friendshipId: 'friendshipid'
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should fail if the session does not own the resource', (done) => {
    const {
      confirmUserOwnsFriendship
    } = mock.reRequire('./confirm-user-owns-friendship');

    MockFriendship.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'diffuserid'
    }]);

    const next = (err) => {
      expect(err.name).toEqual('FriendshipPermissionError');
      done();
    };

    confirmUserOwnsFriendship(_req, null, next);
  });

  it('should continue if the session does own the resource', (done) => {
    const {
      confirmUserOwnsFriendship
    } = mock.reRequire('./confirm-user-owns-friendship');

    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };

    MockFriendship.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'userid'
    }]);

    confirmUserOwnsFriendship(_req, null, next);
  });

  it('should handle errors', (done) => {
    const {
      confirmUserOwnsFriendship
    } = mock.reRequire('./confirm-user-owns-friendship');

    MockFriendship.overrides.find.returnWith = () => {
      return Promise.reject(new Error());
    };

    const next = (err) => {
      expect(err.name).toEqual('Error');
      done();
    };

    confirmUserOwnsFriendship(_req, null, next);
  });

  it('should handle friendship not found error', (done) => {
    const {
      confirmUserOwnsFriendship
    } = mock.reRequire('./confirm-user-owns-friendship');

    MockFriendship.overrides.find.returnWith = () => Promise.resolve([]);

    const next = (err) => {
      expect(err.name).toEqual('FriendshipNotFoundError');
      done();
    };

    confirmUserOwnsFriendship(_req, null, next);
  });

  it('should fail if the friendship ID is not provided', () => {
    const {
      confirmUserOwnsFriendship
    } = mock.reRequire('./confirm-user-owns-friendship');

    _req.params.friendshipId = undefined;

    const next = (err) => {
      expect(err.name).toEqual('FriendshipNotFoundError');
    };

    confirmUserOwnsFriendship(_req, null, next);
  });
});

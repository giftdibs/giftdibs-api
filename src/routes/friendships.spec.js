const mock = require('mock-require');

const {
  MockFriendship,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('Friendships router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockFriendship.reset();

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        friendshipId: 'friendshipid'
      }
    });

    _res = new MockResponse();

    mock('../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
    mock('../database/models/friendship', { Friendship: MockFriendship });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./friendships');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /friendships', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get an array of all friendships', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockFriendship({
            _friend: 'friendid',
            _user: 'userid'
          })
        ]);
      };

      getFriendships(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        done();
      });
    });

    it('should get an array of all friendships belonging to a user', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockFriendship({
            _friend: 'friendid',
            _user: 'userid'
          })
        ]);
      };

      _req.query.userId = 'userid';

      getFriendships(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        expect(Array.isArray(MockFriendship.overrides.find.lastQuery.$or))
          .toEqual(true);
        expect(MockFriendship.overrides.find.lastQuery.$or[0]._user)
          .toEqual('userid');
        done();
      });
    });

    it('should handle errors', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      getFriendships(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('DELETE /friendships/:friendshipId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should require the user owns the friendship', () => {
      const routeDefinition = mock.reRequire('./friendships');
      expect(routeDefinition.middleware.deleteFriendship[0].name)
        .toEqual('confirmUserOwnsFriendship');
    });

    it('should delete a friendship', (done) => {
      spyOn(MockFriendship, 'remove').and.callThrough();

      _req.params.friendshipId = 'friendshipid';

      const routeDefinition = mock.reRequire('./friendships');
      const deleteFriendship = routeDefinition.middleware.deleteFriendship[1];

      deleteFriendship(_req, _res, () => {});

      tick(() => {
        expect(MockFriendship.remove)
          .toHaveBeenCalledWith({
            _id: 'friendshipid'
          });

        expect(_res.json.output.message)
          .toEqual('Friendship successfully deleted.');

        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockFriendship, 'remove').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const routeDefinition = mock.reRequire('./friendships');
      const deleteFriendship = routeDefinition.middleware.deleteFriendship[1];

      deleteFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('POST /friendships', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should create a friendship', (done) => {
      const spy = spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.resolve({
          _id: 'friendshipid'
        })
      );

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, () => { });

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.friendshipId).toEqual('friendshipid');
        done();
      });
    });

    it('should validate the friend request', (done) => {
      MockFriendship.overrides.find.returnWith = () => Promise.resolve([]);

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should fail if already following the user', (done) => {
      MockFriendship.overrides.find.returnWith = () => Promise.resolve([{}]);

      _req.user._id = 'requser';
      _req.body._friend = 'friendid';

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You are already following that person.');
        done();
      });
    });

    it('should fail if request wants to follow itself', (done) => {
      _req.user._id = 'friendid';
      _req.body._friend = 'friendid';

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You cannot follow yourself.');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockFriendship.overrides.save.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      const err = new Error();
      err.name = 'ValidationError';

      spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.reject(err)
      );

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        done();
      });
    });
  });
});

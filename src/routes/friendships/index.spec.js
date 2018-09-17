const mock = require('mock-require');

const {
  MockFriendship,
  MockRequest,
  MockResponse,
  tick
} = require('../../shared/testing');

describe('Friendships router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockFriendship.reset();

    _req = new MockRequest({
      params: {
        friendshipId: 'friendshipid'
      }
    });

    _res = new MockResponse();

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });

    mock('../../database/models/friendship', { Friendship: MockFriendship });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./index');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /friendships', () => {
    it('should get an array of all friendships belonging to a user', (done) => {
      const { getFriendships } = mock.reRequire('./get');

      _req.query.userId = 'userid';

      spyOn(MockFriendship, 'getFriendshipsByUserId').and.returnValue(
        Promise.resolve([
          new MockFriendship({
            _friend: 'friendid',
            _user: 'userid'
          })
        ])
      );

      getFriendships(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.data.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        done();
      });
    });

    it('should fail if user ID not provided', (done) => {
      const { getFriendships } = mock.reRequire('./get');

      getFriendships(_req, _res, (err) => {
        expect(err.message).toEqual('Please provide a user ID.');
        done();
      });
    });

    it('should handle errors', (done) => {
      const { getFriendships } = mock.reRequire('./get');

      _req.query.userId = 'userid';

      spyOn(MockFriendship, 'getFriendshipsByUserId').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      getFriendships(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('DELETE /friendships/:friendshipId', () => {
    it('should check user ownership', () => {
      spyOn(MockFriendship, 'confirmUserOwnership').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { deleteFriendship } = mock.reRequire('./delete');

      deleteFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
      });
    });

    it('should delete a friendship', (done) => {
      const friendship = new MockFriendship({});
      const spy = spyOn(friendship, 'remove');

      spyOn(MockFriendship, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(friendship)
      );

      _req.params.friendshipId = 'friendshipid';

      const { deleteFriendship } = mock.reRequire('./delete');

      deleteFriendship(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.message)
          .toEqual('Friendship successfully deleted.');

        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockFriendship, 'confirmUserOwnership').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { deleteFriendship } = mock.reRequire('./delete');

      deleteFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('POST /friendships', () => {
    it('should create a friendship', (done) => {
      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      const spy = spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.resolve({
          _id: 'friendshipid'
        })
      );

      const { createFriendship } = mock.reRequire('./post');

      _req.body.friendId = 'friendid';

      createFriendship(_req, _res, () => { });

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.data.friendshipId).toEqual('friendshipid');
        done();
      });
    });

    it('should fail if already following the user', (done) => {
      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockFriendship({})
        ]);
      };

      _req.user._id = 'requser';
      _req.body.friendId = 'friendid';

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You are already following that person.');
        done();
      });
    });

    it('should fail if request wants to follow itself', (done) => {
      _req.user._id = 'friendid';
      _req.body.friendId = 'friendid';

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You cannot follow yourself.');
        done();
      });
    });

    it('should fail if friendId not provided', (done) => {
      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.code).toEqual(601);
        expect(err.status).toEqual(400);
        expect(err.message).toEqual('Please provide the user ID of the friend you wish to follow.');
        done();
      });
    });

    it('should handle errors', (done) => {
      _req.body.friendId = 'friendid';
      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      MockFriendship.overrides.save.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      _req.body.friendId = 'friendid';

      const err = new Error();
      err.name = 'ValidationError';

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.reject(err)
      );

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        done();
      });
    });
  });
});

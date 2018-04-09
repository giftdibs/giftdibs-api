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
      user: {
        _id: 'userid'
      },
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
    it('should get an array of all friendships', (done) => {
      const { getFriendships } = mock.reRequire('./get');

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
        expect(Array.isArray(_res.json.output.data.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        done();
      });
    });

    it('should get an array of all friendships belonging to a user', (done) => {
      const { getFriendships } = mock.reRequire('./get');

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
        expect(Array.isArray(_res.json.output.data.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        expect(Array.isArray(MockFriendship.overrides.find.lastQuery.$or))
          .toEqual(true);
        expect(MockFriendship.overrides.find.lastQuery.$or[0]._user)
          .toEqual('userid');
        done();
      });
    });

    it('should handle errors', (done) => {
      const { getFriendships } = mock.reRequire('./get');

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

      _req.body._friend = 'friendid';

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
      _req.body._friend = 'friendid';

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You are already following that person.');
        done();
      });
    });

    it('should fail if request wants to follow itself', (done) => {
      _req.user._id = 'friendid';
      _req.body._friend = 'friendid';

      const { createFriendship } = mock.reRequire('./post');

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You cannot follow yourself.');
        done();
      });
    });

    it('should handle errors', (done) => {
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

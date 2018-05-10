const mock = require('mock-require');
const mongoose = require('mongoose');

const {
  MockDib,
  MockFriendship,
  MockWishList,
  MockRequest,
  MockResponse,
  tick
} = require('../../shared/testing');

describe('Wish lists router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockDib.reset();
    MockFriendship.reset();
    MockWishList.reset();

    mock('../../database/models/dib', { Dib: MockDib });
    mock('../../database/models/friendship', { Friendship: MockFriendship })
    mock('../../database/models/wish-list', { WishList: MockWishList });

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });

    _req = new MockRequest({
      params: {
        wishListId: 0
      }
    });

    _res = new MockResponse();
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const wishLists = mock.reRequire('./index');
    expect(wishLists.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /wish-lists', () => {
    it('should get an array of all wish lists', (done) => {
      const { getWishLists } = mock.reRequire('./get');

      getWishLists(_req, _res, () => { });

      tick(() => {
        expect(Array.isArray(_res.json.output.data.wishLists)).toEqual(true);
        done();
      });
    });

    it('should get an array of all wish lists belonging to a user', (done) => {
      const { getWishLists } = mock.reRequire('./get');

      _req.query.userId = 'abc123';

      getWishLists(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.data.wishLists)).toEqual(true);
        done();
      });
    });

    it('should only populate certain fields', (done) => {
      const { getWishLists } = mock.reRequire('./get');

      getWishLists(_req, _res, () => {});

      tick(() => {
        expect(MockWishList.populatedFields['_user'])
          .toEqual('firstName lastName');
        done();
      });
    });

    it('should only get wish lists the user is authorized to view', (done) => {
      const { getWishLists } = mock.reRequire('./get');

      const userId = mongoose.Types.ObjectId();
      const friendId = mongoose.Types.ObjectId();

      _req.user._id = userId;

      MockWishList.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockWishList({
            name: 'Private list (owned)',
            _user: {
              _id: userId
            },
            privacy: {
              type: 'me'
            }
          }),
          new MockWishList({
            name: 'Private list (not owned)',
            privacy: {
              type: 'me'
            }
          }),
          new MockWishList({
            name: 'Public list',
            privacy: {
              type: 'everyone'
            }
          }),
          new MockWishList({
            name: 'Custom list (allowed)',
            _user: {
              _id: friendId
            },
            privacy: {
              type: 'custom',
              _allow: [userId]
            }
          }),
          new MockWishList({
            name: 'Custom list (not allowed)',
            _user: {
              _id: friendId
            },
            privacy: {
              type: 'custom',
              _allow: [mongoose.Types.ObjectId()]
            }
          }),
          new MockWishList({
            name: 'Default list'
          })
        ]);
      };

      getWishLists(_req, _res, () => { });

      tick(() => {
        const wishLists = _res.json.output.data.wishLists;
        expect(wishLists.length).toEqual(4);
        expect(wishLists[0].name).toEqual('Private list (owned)');
        expect(wishLists[1].name).toEqual('Public list');
        expect(wishLists[2].name).toEqual('Custom list (allowed)');
        expect(wishLists[3].name).toEqual('Default list');
        done();
      });
    });

    it('should handle mongoose errors', (done) => {
      MockWishList.overrides.find.returnWith = () => {
        return Promise.reject(new Error());
      };

      const { getWishLists } = mock.reRequire('./get');

      getWishLists(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('GET /wish-lists/:wishListId', () => {
    it('should get a single document', (done) => {
      const { getWishList } = mock.reRequire('./get');

      _req.user = {
        _id: 'abc'
      };

      MockWishList.overrides.constructorDefinition = {
        _user: {
          _id: 'abc'
        }
      };

      getWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.data.wishList._id).toBeDefined();
        done();
      });
    });

    it('should only populate certain fields', (done) => {
      const { getWishList } = mock.reRequire('./get');

      getWishList(_req, _res, () => {});

      tick(() => {
        expect(MockWishList.populatedFields['_user'])
          .toEqual('firstName lastName');
        done();
      });
    });

    it('should fail if user is unauthorized to view', (done) => {
      const { getWishList } = mock.reRequire('./get');

      const userId = mongoose.Types.ObjectId();

      _req.user = {
        _id: userId
      };

      MockWishList.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockWishList({
            _user: {
              _id: 'foo'
            },
            privacy: {
              type: 'me'
            }
          })
        ]);
      };

      getWishList(_req, _res, (err) => {
        expect(err.name).toEqual('WishListPermissionError');
        expect(err.message).toEqual('You are not authorized to view that wish list.');
        done();
      });
    });

    it('should handle wish list not found', (done) => {
      MockWishList.overrides.find.returnWith = () => Promise.resolve([]);

      const { getWishList } = mock.reRequire('./get');

      getWishList(_req, _res, (err) => {
        expect(err.name).toEqual('WishListNotFoundError');
        done();
      });
    });

    it('should handle mongoose errors', (done) => {
      MockWishList.overrides.find.returnWith = () => {
        return Promise.reject(new Error());
      };

      const { getWishList } = mock.reRequire('./get');

      getWishList(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('POST /wish-lists', () => {
    it('should create new wish lists', (done) => {
      const { createWishList } = mock.reRequire('./post');

      _req.body.attributes.name = 'New wish list';

      createWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.data.wishListId).toBeDefined();
        expect(_res.json.output.message).toEqual('Wish list successfully created.');
        expect(_res.json.output.authResponse).toBeDefined();
        expect(MockWishList.lastTouched.name).toEqual('New wish list');
        done();
      });
    });

    it('should handle schema validation errors', (done) => {
      MockWishList.overrides.save.returnWith = () => {
        return Promise.reject(new Error());
      };

      const { createWishList } = mock.reRequire('./post');

      createWishList(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('PATCH /wish-lists/:wishListId', () => {
    it('should update a document', (done) => {
      const wishList = new MockWishList({
        name: 'Old name',
        _id: 'wishlistid'
      });

      const updateSpy = spyOn(wishList, 'updateSync');
      const saveSpy = spyOn(wishList, 'save');

      spyOn(MockWishList, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(wishList)
      );

      _req.params.wishListId = 'wishlistid';
      _req.body.attributes.name = 'Updated name';

      const { updateWishList } = mock.reRequire('./patch');

      updateWishList(_req, _res, () => {});

      tick(() => {
        expect(updateSpy).toHaveBeenCalledWith(_req.body.attributes);
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should handle a schema validation error', (done) => {
      MockWishList.overrides.save.returnWith = () => {
        const error = new Error();
        error.name = 'ValidationError';
        return Promise.reject(error);
      };

      _req.body = { invalidField: 'foobar' };

      const { updateWishList } = mock.reRequire('./patch');

      updateWishList(_req, _res, (err) => {
        expect(err.name).toEqual('WishListValidationError');
        done();
      });
    });
  });

  describe('DELETE /wish-lists/:wishListId', () => {
    it('should remove a document', (done) => {
      const wishList = new MockWishList({});
      const spy = spyOn(wishList, 'remove');

      spyOn(MockWishList, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(wishList)
      );

      const { deleteWishList } = mock.reRequire('./delete');

      deleteWishList(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.message).toEqual(
          'Wish list successfully deleted.'
        );
        done();
      });
    });
  });
});

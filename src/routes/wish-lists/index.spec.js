const mock = require('mock-require');

const {
  MockDib,
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
    MockWishList.reset();

    mock('../../database/models/wish-list', { WishList: MockWishList });
    mock('../../database/models/dib', { Dib: MockDib });

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });

    _req = new MockRequest({
      user: {},
      params: {
        wishListId: 0
      },
      body: {
        attributes: {}
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
    it('should get an array of all documents', (done) => {
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

      _req.user._id = 'userid';
      _req.body.attributes.name = 'New wish list';

      createWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.data.wishList).toBeDefined();
        expect(_res.json.output.message)
          .toEqual('Wish list successfully created.');
        expect(_res.json.output.authResponse).toBeDefined();
        expect(MockWishList.lastTouched._user).toEqual('userid');
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

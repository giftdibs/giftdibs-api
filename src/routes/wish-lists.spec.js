const mock = require('mock-require');

const { MockWishList, MockRequest, MockResponse, tick } = require('../shared/testing');

describe('Wish list router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockWishList.reset();
    mock('../database/models/wish-list', MockWishList);

    _req = new MockRequest({
      user: {},
      params: {
        wishListId: 0
      }
    });
    _res = new MockResponse();
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const wishLists = mock.reRequire('./wish-lists');
    expect(wishLists.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /wish-lists', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get an array of all documents', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const getWishLists = wishLists.middleware.getWishLists[0];

      getWishLists(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.wishLists)).toEqual(true);
        done();
      });
    });

    it('should get an array of all wish lists belonging to a user', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const getWishLists = wishLists.middleware.getWishLists[0];

      _req.query.userId = 'abc123';

      getWishLists(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.wishLists)).toEqual(true);
        done();
      });
    });

    it('should only populate certain fields', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const getWishLists = wishLists.middleware.getWishLists[0];

      getWishLists(_req, _res, () => {});

      tick(() => {
        expect(MockWishList.populatedFields['_user']).toEqual('firstName lastName');
        done();
      });
    });

    it('should handle mongoose errors', (done) => {
      MockWishList.overrides.find.returnWith = () => Promise.reject(new Error());

      const wishLists = mock.reRequire('./wish-lists');
      const getWishLists = wishLists.middleware.getWishLists[0];

      getWishLists(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('GET /wish-lists/:wishListId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get a single document', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const getWishList = wishLists.middleware.getWishList[0];

      getWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.wishList._id).toBeDefined();
        expect(typeof _res.json.output.externalUrls.dateScrapedRecommended).toEqual('number');
        done();
      });
    });

    it('should only populate certain fields', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const getWishList = wishLists.middleware.getWishList[0];

      getWishList(_req, _res, () => {});

      tick(() => {
        expect(MockWishList.populatedFields['_user']).toEqual('firstName lastName');
        done();
      });
    });

    it('should handle wish list not found', (done) => {
      MockWishList.overrides.find.returnWith = () => Promise.resolve([]);

      const wishLists = mock.reRequire('./wish-lists');
      const getWishList = wishLists.middleware.getWishList[0];

      getWishList(_req, _res, (err) => {
        expect(err.name).toEqual('WishListNotFoundError');
        done();
      });
    });

    it('should handle mongoose errors', (done) => {
      MockWishList.overrides.find.returnWith = () => Promise.reject(new Error());

      const wishLists = mock.reRequire('./wish-lists');
      const getWishList = wishLists.middleware.getWishList[0];

      getWishList(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('POST /wish-lists', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should create new wish lists', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const createWishList = wishLists.middleware.createWishList[0];

      _req.user._id = 'userid';
      _req.body.name = 'New wish list';

      createWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.id).toBeDefined();
        expect(_res.json.output.message).toBeDefined();
        expect(MockWishList.lastTouched._user).toEqual('userid');
        expect(MockWishList.lastTouched.name).toEqual('New wish list');
        done();
      });
    });

    it('should handle schema validation errors', (done) => {
      MockWishList.overrides.save.returnWith = () => Promise.reject(new Error());

      const wishLists = mock.reRequire('./wish-lists');
      const createWishList = wishLists.middleware.createWishList[0];

      createWishList(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('PATCH /wish-lists/:wishListId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update a document', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const updateWishList = wishLists.middleware.updateWishList[1];

      _req.body = { name: 'NewName' };

      updateWishList(_req, _req, () => {});

      spyOn(MockWishList.lastTouched, 'update');

      tick(() => {
        expect(MockWishList.lastTouched.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should only update a document if it is owned by the session user', () => {
      const wishLists = mock.reRequire('./wish-lists');
      expect(wishLists.middleware.updateWishList[0].name).toEqual('confirmUserOwnsWishList');
    });

    it('should handle a schema validation error', (done) => {
      MockWishList.overrides.save.returnWith = () => {
        const error = new Error();
        error.name = 'ValidationError';
        return Promise.reject(error);
      };

      _req.body = { invalidField: 'foobar' };

      const wishLists = mock.reRequire('./wish-lists');
      const updateWishList = wishLists.middleware.updateWishList[1];
      let _err;

      updateWishList(_req, _res, (err) => {
        _err = err;
      });

      spyOn(MockWishList.lastTouched, 'set');

      tick(() => {
        expect(_err).toBeDefined();
        expect(_err.code).toEqual(301);
        expect(_err.status).toEqual(400);
        done();
      });
    });
  });

  describe('DELETE /wish-lists/:wishListId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should remove a document', (done) => {
      const wishLists = mock.reRequire('./wish-lists');
      const deleteWishList = wishLists.middleware.deleteWishList[1];
      deleteWishList(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.message).toBeDefined();
        done();
      });
    });

    it('should only remove a document if it is owned by the session user', () => {
      const wishLists = mock.reRequire('./wish-lists');
      expect(wishLists.middleware.deleteWishList[0].name).toEqual('confirmUserOwnsWishList');
    });
  });
});

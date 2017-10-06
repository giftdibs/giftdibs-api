const mock = require('mock-require');

const {
  MockDib,
  MockGift,
  MockRequest,
  MockResponse,
  MockWishList,
  tick
} = require('../shared/testing');

describe('Wish list router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockWishList.reset();
    mock('../database/models/wish-list', MockWishList);
    mock('../database/models/dib', MockDib);

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
        expect(_res.json.output.wishList._id).toBeDefined();
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

    it('should get a single document and sort gifts by order', (done) => {
      MockWishList.overrides.find.returnWith = () => Promise.resolve([
        new MockWishList({
          _user: {
            _id: 'abc'
          },
          gifts: [
            new MockGift({
              name: 'D',
              order: 999
            }),
            new MockGift({
              name: 'B',
              order: 1
            }),
            new MockGift({
              name: 'E',
              order: 999
            }),
            new MockGift({
              name: 'F'
            }),
            new MockGift({
              name: 'G'
            }),
            new MockGift({
              name: 'C',
              order: 2
            }),
            new MockGift({
              name: 'A',
              order: 0
            })
          ]
        })
      ]);

      _req.user = {
        _id: 'abc'
      };

      const wishLists = mock.reRequire('./wish-lists');
      const getWishList = wishLists.middleware.getWishList[0];

      getWishList(_req, _res, () => {});

      tick(() => {
        const gifts = _res.json.output.wishList.gifts;
        expect(gifts[0].name).toEqual('A');
        expect(gifts[1].name).toEqual('B');
        expect(gifts[2].name).toEqual('C');
        expect(gifts[3].name).toEqual('D');
        expect(gifts[4].name).toEqual('E');
        expect(gifts[5].name).toEqual('F');
        expect(gifts[6].name).toEqual('G');
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
        expect(_res.json.output.wishListId).toBeDefined();
        expect(_res.json.output.message).toEqual('Wish list successfully created.');
        expect(_res.json.output.authResponse).toBeDefined();
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

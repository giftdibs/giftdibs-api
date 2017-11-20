const mock = require('mock-require');

const {
  MockGift,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('Gifts router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockGift.reset();

    _req = new MockRequest({
      user: {},
      params: {
        giftId: 'giftid'
      }
    });
    _res = new MockResponse();

    mock('../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
    mock('../database/models/gift', { Gift: MockGift });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./gifts');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should require user owns the gift and wish list for all routes', () => {
    const middleware = mock.reRequire('./gifts').middleware;
    expect(middleware.addGift[0].name).toEqual('confirmUserOwnsWishList');
    expect(middleware.deleteGift[0].name).toEqual('confirmUserOwnsGift');
    expect(middleware.updateGift[0].name).toEqual('confirmUserOwnsGift');
    expect(middleware.updateGift[1].name).toEqual('confirmUserOwnsWishList');
  });

  describe('GET /gifts', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get an unsorted array of all gifts', (done) => {
      const gifts = mock.reRequire('./gifts');
      const getGifts = gifts.middleware.getGifts[0];

      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockGift({
            _wishList: 'wishlistid',
            name: 'foo',
            orderInWishList: 1
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'bar',
            orderInWishList: 0
          })
        ]);
      };

      getGifts(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.gifts)).toEqual(true);
        expect(_res.json.output.gifts[0].name).toEqual('foo');
        done();
      });
    });

    it('should get an array of all gifts in a wish list, ordered', (done) => {
      const gifts = mock.reRequire('./gifts');
      const getGifts = gifts.middleware.getGifts[0];

      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockGift({
            _wishList: 'wishlistid',
            name: 'd',
            orderInWishList: 2
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'a',
            orderInWishList: 0
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'e'
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'c',
            orderInWishList: 1
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'b',
            orderInWishList: 0
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'f'
          })
        ]);
      };

      _req.query.wishListId = 'wishlistid';

      getGifts(_req, _res, () => { });

      tick(() => {
        const gifts = _res.json.output.gifts;
        expect(gifts[0].name).toEqual('a');
        expect(gifts[1].name).toEqual('b');
        expect(gifts[2].name).toEqual('c');
        expect(gifts[3].name).toEqual('d');
        expect(gifts[4].name).toEqual('e');
        expect(gifts[5].name).toEqual('f');
        done();
      });
    });

    it('should handle errors', (done) => {
      const gifts = mock.reRequire('./gifts');
      const getGifts = gifts.middleware.getGifts[0];

      MockGift.overrides.find.returnWith = () => Promise.reject(new Error());

      getGifts(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('POST /gifts', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should create a gift', (done) => {
      MockGift.overrides.save.returnWith = () => Promise.resolve({
        _id: 'newgiftid'
      });
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      _req.body.name = 'New gift';

      addGift(_req, _res, () => { });

      tick(() => {
        expect(_res.json.output.giftId).toEqual('newgiftid');
        expect(MockGift.lastTouched.name).toEqual('New gift');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockGift.overrides.save.returnWith = () => Promise.reject(new Error());
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      addGift(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });

    it('should handle validation errors', (done) => {
      MockGift.overrides.save.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      addGift(_req, _res, (err) => {
        expect(err.name).toEqual('GiftValidationError');
        done();
      });
    });
  });

  describe('DELETE /gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should delete a gift', (done) => {
      spyOn(MockGift, 'remove').and.callThrough();
      _req.params.giftId = 'giftid';

      const routeDefinition = mock.reRequire('./gifts');
      const deleteGift = routeDefinition.middleware.deleteGift[1];

      deleteGift(_req, _res, () => {});

      tick(() => {
        expect(MockGift.remove).toHaveBeenCalledWith({ _id: 'giftid' });
        expect(_res.json.output.message).toEqual('Gift successfully deleted.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockGift, 'remove').and.returnValue(Promise.reject(new Error()));
      const routeDefinition = mock.reRequire('./gifts');
      const deleteGift = routeDefinition.middleware.deleteGift[1];

      deleteGift(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('PATCH /gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update a gift', (done) => {
      const gift = new MockGift({
        name: 'Old name',
        _id: 'giftid'
      });

      const updateSpy = spyOn(gift, 'updateSync');
      const saveSpy = spyOn(gift, 'save');

      spyOn(MockGift, 'find').and.returnValue({
        limit: () => {
          return Promise.resolve([gift]);
        }
      });

      _req.params.giftId = 'giftid';
      _req.body.name = 'Updated name';

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[2];

      updateGift(_req, _res, () => {});

      tick(() => {
        expect(updateSpy).toHaveBeenCalledWith(_req.body);
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockGift, 'find').and.returnValue({
        limit: () => {
          return Promise.reject(new Error());
        }
      });

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[2];

      updateGift(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });
});

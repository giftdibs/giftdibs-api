const mock = require('mock-require');

const {
  MockGift,
  MockWishList,
  MockExternalUrl,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('Gifts router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockWishList.reset();

    _req = new MockRequest({
      user: {},
      params: {
        wishListId: 0
      }
    });
    _res = new MockResponse();

    mock('../database/models/gift', MockGift);
    mock('../database/models/wish-list', MockWishList);
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

  it('should require the user owns the wishList for all routes', () => {
    const routeDefinition = mock.reRequire('./gifts');
    expect(routeDefinition.middleware.addGift[0].name).toEqual('confirmUserOwnsWishList');
    expect(routeDefinition.middleware.deleteGift[0].name).toEqual('confirmUserOwnsWishList');
    expect(routeDefinition.middleware.updateGift[0].name).toEqual('confirmUserOwnsWishList');
  });

  describe('POST /wish-lists/:wishListId/gifts', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should add a gift to a wish list', (done) => {
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      _req.body.name = 'New gift';

      addGift(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.giftId).toEqual('abc123');
        expect(MockWishList.lastTouched.gifts[0].name).toEqual('New gift');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockWishList.overrides.save.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      let _err;
      addGift(_req, _res, (err) => {
        _err = err
      });

      tick(() => {
        expect(_err.code).toEqual(401);
        expect(_err.status).toEqual(400);
        expect(_err.message).toEqual('Gift update validation failed.');
        done();
      });
    });
  });

  describe('DELETE /wish-lists/:wishListId/gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should remove a gift from a wish list', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({ _id: '123' })
        ]
      };

      _req.params.giftId = '123';

      const routeDefinition = mock.reRequire('./gifts');
      const deleteGift = routeDefinition.middleware.deleteGift[1];

      deleteGift(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.message).toEqual('Gift successfully deleted.');
        done();
      });
    });

    it('should handle errors', (done) => {
      const routeDefinition = mock.reRequire('./gifts');
      const deleteGift = routeDefinition.middleware.deleteGift[1];

      let _err;
      deleteGift(_req, _res, (err) => { _err = err; });

      tick(() => {
        expect(_err).toBeDefined();
        done();
      });
    });
  });

  describe('PATCH /wish-lists/:wishListId/gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update a gift', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '12345'
          })
        ]
      };

      _req.params.giftId = '12345';
      _req.body.name = 'Updated name';

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[1];

      updateGift(_req, _res, () => {});

      const gift = MockWishList.lastTouched.gifts[0];

      spyOn(gift, 'update');

      tick(() => {
        expect(gift.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should update gift external urls', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '12345',
            externalUrls: [
              new MockExternalUrl({
                _id: 'abc',
                url: 'http://'
              }),
              new MockExternalUrl({
                _id: 'def',
                url: 'http://'
              })
            ]
          })
        ]
      };

      _req.params.giftId = '12345';
      _req.body.externalUrls = [{
        _id: 'abc',
        url: 'http://new.com'
      }];

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[1];

      updateGift(_req, _res, () => {});

      const gift = MockWishList.lastTouched.gifts[0];
      spyOn(gift.externalUrls[0], 'update');

      tick(() => {
        expect(gift.externalUrls[0].update).toHaveBeenCalledWith(_req.body.externalUrls[0]);
        done();
      });
    });

    it('should remove gift external urls', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '12345',
            externalUrls: [
              new MockExternalUrl({
                _id: 'abc',
                url: 'http://'
              })
            ]
          })
        ]
      };

      _req.params.giftId = '12345';
      _req.body.externalUrls = [];

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[1];

      updateGift(_req, _res, () => {});

      const gift = MockWishList.lastTouched.gifts[0];
      spyOn(gift.externalUrls[0], 'remove');

      tick(() => {
        expect(gift.externalUrls[0].remove).toHaveBeenCalledWith();
        done();
      });
    });

    it('should add external urls to gifts', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '12345',
            externalUrls: []
          })
        ]
      };

      _req.params.giftId = '12345';
      _req.body.externalUrls = [
        {
          url: 'http://new.com'
        }
      ];

      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[1];

      updateGift(_req, _res, () => {});

      const gift = MockWishList.lastTouched.gifts[0];

      tick(() => {
        expect(gift.externalUrls[0].url).toEqual('http://new.com');
        done();
      });
    });

    it('should handle errors', (done) => {
      const routeDefinition = mock.reRequire('./gifts');
      const updateGift = routeDefinition.middleware.updateGift[1];

      let _err;
      updateGift(_req, _res, (err) => { _err = err; });

      tick(() => {
        expect(_err).toBeDefined();
        done();
      });
    });
  });
});

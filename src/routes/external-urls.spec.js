const mock = require('mock-require');

const {
  MockGift,
  MockWishList,
  MockExternalUrl,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('External URLs router', () => {
  let _req;
  let _res;
  let urlScraper;

  const beforeEachCallback = () => {
    urlScraper = mock.reRequire('../utils/url-scraper');
    MockWishList.reset();

    _req = new MockRequest({
      user: {},
      params: {
        wishListId: 0
      }
    });
    _res = new MockResponse();

    mock('../database/models/external-url', MockExternalUrl);
    mock('../database/models/gift', MockGift);
    mock('../database/models/wish-list', MockWishList);
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./external-urls');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should require the user owns the wishList for all routes', () => {
    const routeDefinition = mock.reRequire('./external-urls');
    expect(routeDefinition.middleware.updateExternalUrl[0].name).toEqual('confirmUserOwnsWishList');
  });

  describe('PATCH /wish-lists/:wishListId/gifts/:giftId/external-urls/:externalUrlId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update urls', (done) => {
      spyOn(urlScraper, 'getProductDetails').and.returnValue();

      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '123',
            externalUrls: [
              new MockExternalUrl({
                _id: '123'
              })
            ]
          })
        ]
      };

      _req.params.giftId = '123';
      _req.params.externalUrlId = '123';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      updateExternalUrl(_req, _res, () => {});

      const externalUrl = MockWishList.lastTouched.gifts[0].externalUrls[0];
      spyOn(externalUrl, 'update');

      tick(() => {
        expect(externalUrl.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should scrape urls', (done) => {
      spyOn(urlScraper, 'getProductDetails').and.returnValue(
        Promise.resolve([{
          price: 1
        }])
      );

      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '123',
            externalUrls: [
              new MockExternalUrl({
                _id: '123',
                url: 'http://'
              })
            ]
          })
        ]
      };

      _req.params.giftId = '123';
      _req.params.externalUrlId = '123';
      _req.query.scrapeUrl = 'true';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      updateExternalUrl(_req, _res, () => {});

      const externalUrl = MockWishList.lastTouched.gifts[0].externalUrls[0];
      spyOn(externalUrl, 'update');

      tick(() => {
        expect(urlScraper.getProductDetails).toHaveBeenCalledWith(['http://']);
        expect(externalUrl.dateScraped).toBeDefined();
        expect(externalUrl.price).toEqual(1);
        expect(externalUrl.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should scrape urls and only update the external url if product has a price', (done) => {
      spyOn(urlScraper, 'getProductDetails').and.returnValue(
        Promise.resolve([{}])
      );

      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '123',
            externalUrls: [
              new MockExternalUrl({
                _id: '123',
                url: 'http://',
                price: 0
              })
            ]
          })
        ]
      };

      _req.params.giftId = '123';
      _req.params.externalUrlId = '123';
      _req.query.scrapeUrl = 'true';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      updateExternalUrl(_req, _res, () => {});

      const externalUrl = MockWishList.lastTouched.gifts[0].externalUrls[0];
      spyOn(externalUrl, 'update');

      tick(() => {
        expect(urlScraper.getProductDetails).toHaveBeenCalledWith(['http://']);
        expect(externalUrl.price).toEqual(0);
        expect(externalUrl.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should not scrape a url if the price is current', (done) => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - (1000 * 60 * 5));

      urlScraper.dateScrapedRecommended = fiveMinAgo.getTime();

      spyOn(urlScraper, 'getProductDetails').and.returnValue(
        Promise.resolve([{}])
      );

      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '123',
            externalUrls: [
              new MockExternalUrl({
                _id: '123',
                url: 'http://',
                price: 0,
                dateScraped: now
              })
            ]
          })
        ]
      };

      _req.params.giftId = '123';
      _req.params.externalUrlId = '123';
      _req.query.scrapeUrl = 'true';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      updateExternalUrl(_req, _res, () => {});

      const externalUrl = MockWishList.lastTouched.gifts[0].externalUrls[0];
      spyOn(externalUrl, 'update');

      tick(() => {
        expect(externalUrl.price).toEqual(0);
        expect(externalUrl.update).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should handle url not found', (done) => {
      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({ _id: '123' })
        ]
      };

      _req.params.giftId = '123';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      let _err;
      updateExternalUrl(_req, _res, (err) => { _err = err });

      tick(() => {
        expect(_err.name).toEqual('ExternalUrlNotFoundError');
        expect(_err.code).toEqual(500);
        expect(_err.status).toEqual(400);
        done();
      });
    });

    it('should handle schema validation errors', (done) => {
      MockWishList.overrides.save.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };

      MockWishList.overrides.constructorDefinition = {
        gifts: [
          new MockGift({
            _id: '123',
            externalUrls: [
              new MockExternalUrl({
                _id: '123'
              })
            ]
          })
        ]
      };

      _req.params.giftId = '123';
      _req.params.externalUrlId = '123';

      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      let _err;
      updateExternalUrl(_req, _res, (err) => { _err = err });

      tick(() => {
        expect(_err.message).toEqual('External URL update validation failed.');
        expect(_err.code).toEqual(501);
        expect(_err.status).toEqual(400);
        done();
      });
    });

    it('should handle other errors', (done) => {
      const routeDefinition = mock.reRequire('./external-urls');
      const updateExternalUrl = routeDefinition.middleware.updateExternalUrl[1];

      let _err;
      updateExternalUrl(_req, _res, (err) => { _err = err });

      tick(() => {
        expect(_err).toBeDefined();
        done();
      });
    });
  });
});

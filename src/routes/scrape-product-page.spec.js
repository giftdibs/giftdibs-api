const mock = require('mock-require');

describe('/scrape-product-page', () => {
  let _req;
  let urlScraper;

  beforeEach(() => {
    _req = {
      query: {
        url: 'http://'
      }
    };
    urlScraper = mock.reRequire('../utils/url-scraper');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt with every request', () => {
    const routeDefinition = mock.reRequire('./scrape-product-page');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should return page content details with the response', () => {
    spyOn(urlScraper, 'getProductDetails').and.returnValue(Promise.resolve({}));
    const routeDefinition = mock.reRequire('./scrape-product-page');
    const scrapeProductPage = routeDefinition.middleware.scrapeProductPage[0];
    const res = {
      json(data) {
        expect(data.product).toBeDefined();
      }
    };
    scrapeProductPage(_req, res, () => {});
  });

  it('should handle invalid URLs', () => {
    spyOn(urlScraper, 'getProductDetails').and.returnValue(Promise.resolve({}));
    const routeDefinition = mock.reRequire('./scrape-product-page');
    const scrapeProductPage = routeDefinition.middleware.scrapeProductPage[0];
    const res = {};
    _req.query.url = undefined;
    scrapeProductPage(_req, res, (err) => {
      expect(err.code).toEqual(500);
      expect(err.status).toEqual(400);
    });
  });
});

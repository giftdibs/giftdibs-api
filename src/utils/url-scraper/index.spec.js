const mock = require('mock-require');

describe('url scraper util', () => {
  let _scraperConfig = {
    ignoredResources: [],
    nameSelector: '.foo-product-name',
    priceSelector: '.foo-price',
    thumbnailSelector: '.foo-thumbnail'
  };
  let _thumbnailSrc = 'thumbnail.jpg';
  let _pipelineHandlerCallback;
  let _fetchResponse = {};

  function MockBrowser() {
    return {
      pipeline: {
        addHandler(callback) {
          _pipelineHandlerCallback = callback;
        }
      },
      visit(url, callback) {
        callback();
      },
      wait() {},
      html() {}
    };
  }

  beforeEach(() => {
    _fetchResponse = {};
    _pipelineHandlerCallback = () => {};

    mock('zombie', MockBrowser);
    mock('zombie/lib/fetch', {
      Response: function (content, response) {
        _fetchResponse.content = content;
        _fetchResponse.response = response;
      }
    });

    mock('./config', {
      getConfig() {
        return _scraperConfig;
      }
    });

    mock('cheerio', {
      load() {
        return (selector) => {
          return {
            text: () => {
              let text;
              switch (selector) {
                case '.foo-product-name':
                  text = 'Product Name';
                  break;
                case '.foo-price':
                  text = '100.00';
                  break;
                default:
                  text = '';
                  break;
              }
              return text;
            },
            first: () => {
              return {
                attr: () => {
                  return _thumbnailSrc;
                }
              }
            }
          }
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should scrape a url and return product details', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    getProductDetails(['http://foo.bar'])
      .then((products) => {
        const product = products[0];
        expect(product.name).toEqual('Product Name');
        expect(product.price).toEqual(100);
        expect(product.thumbnailSrc).toEqual('thumbnail.jpg');
        expect(product.url).toEqual('http://foo.bar');
        done();
      });
  });

  it('should scrape multiple urls', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    getProductDetails(['http://foo.bar', 'http://bar.baz'])
      .then((products) => {
        expect(products[0].name).toEqual('Product Name');
        expect(products[0].url).toEqual('http://foo.bar');
        expect(products[1].name).toEqual('Product Name');
        expect(products[1].url).toEqual('http://bar.baz');
        done();
      });
  });

  it('should return defaults for invalid values', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    _scraperConfig.nameSelector = '';
    _scraperConfig.priceSelector = '';
    _scraperConfig.thumbnailSelector = '';
    _thumbnailSrc = '';
    getProductDetails(['http://foo.bar'])
      .then((products) => {
        const product = products[0];
        expect(product.name).toEqual('No product name found');
        expect(product.price).toEqual(0);
        expect(product.thumbnailSrc).toEqual('');
        expect(product.url).toEqual('http://foo.bar');
        done();
      });
  });

  it('should ignore specific resources', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    _scraperConfig.ignoredResources = [
      'http://ignore.com',
      'http://google.com'
    ];
    const result = getProductDetails(['http://foo.bar']);
    _pipelineHandlerCallback({}, { url: 'http://ignore.com' });
    _pipelineHandlerCallback({}, { url: 'http://valid.com' });
    result.then(() => {
      expect(_fetchResponse.content).toEqual('');
      expect(_fetchResponse.response).toEqual({ status: 200 });
      done();
    });
  });
});

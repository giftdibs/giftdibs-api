const mock = require('mock-require');

describe('url scraper util', () => {
  let _scraperConfig = {
    ignoreResources: [],
    nameSelector: '.foo-product-name',
    priceSelector: '.foo-price',
    thumbnailSelector: '.foo-thumbnail'
  };
  let _thumbnailSrc = 'thumbnail.jpg';
  let _onCallbacks = {};
  let _pipelineHandlerCallback;
  let _fetchResponse = {};

  function MockBrowser() {
    return {
      on(hook, callback) {
        if (!_onCallbacks[hook]) {
          _onCallbacks[hook] = [];
        }

        _onCallbacks[hook].push(callback);
      },
      pipeline: {
        addHandler(callback) {
          _pipelineHandlerCallback = callback;
        }
      },
      visit(url, opts, callback) {
        callback();
      },
      wait() {},
      html() {}
    };
  }

  beforeEach(() => {
    _onCallbacks = {};
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
    getProductDetails('http://foo.bar')
      .then((details) => {
        expect(details.name).toEqual('Product Name');
        expect(details.price).toEqual(100);
        expect(details.thumbnailSrc).toEqual('thumbnail.jpg');
        expect(details.url).toEqual('http://foo.bar');
        done();
      });
  });

  it('should return defaults for invalid values', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    _scraperConfig.nameSelector = '';
    _scraperConfig.priceSelector = '';
    _scraperConfig.thumbnailSelector = '';
    _thumbnailSrc = '';
    getProductDetails('http://foo.bar')
      .then((details) => {
        expect(details.name).toEqual('');
        expect(details.price).toEqual(0);
        expect(details.thumbnailSrc).toEqual('');
        expect(details.url).toEqual('http://foo.bar');
        done();
      });
  });

  it('should ignore specific resources', (done) => {
    const { getProductDetails } = mock.reRequire('./index');
    _scraperConfig.ignoreResources = [
      'http://ignore.com',
      'http://google.com'
    ];
    const result = getProductDetails('http://foo.bar');
    _pipelineHandlerCallback({}, { url: 'http://ignore.com' });
    result.then(() => {
      expect(_fetchResponse.content).toEqual('');
      expect(_fetchResponse.response).toEqual({ status: 200 });
      done();
    });
  });

  it('should wait until all resources have loaded', (done) => {
    spyOn(console, 'log').and.returnValue();
    const { getProductDetails } = mock.reRequire('./index');
    const result = getProductDetails('http://foo.bar', { resourcesWaitDuration: 1 });
    _pipelineHandlerCallback({}, { url: '' });
    Object.keys(_onCallbacks).forEach((key) => {
      _onCallbacks[key].forEach((callback) => {
        // Add another request to offset the counter.
        if (key === 'request') {
          callback();
        }

        callback();
      });
    });
    result.then((details) => {
      expect(console.log).toHaveBeenCalledWith('Maximum checks reached!');
      done();
    });
  });
});

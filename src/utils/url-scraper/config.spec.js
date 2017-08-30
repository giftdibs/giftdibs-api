const mock = require('mock-require');

describe('url scraper config util', () => {
  const isValidConfig = (config) => {
    return (
      config.nameSelector !== undefined &&
      config.priceSelector !== undefined &&
      config.thumbnailSelector !== undefined &&
      typeof config.ignoredResources.push === 'function'
    );
  };

  afterEach(() => {
    mock.stopAll();
  });

  it('should return a product config for specific site', () => {
    const { getConfig } = mock.reRequire('./config');

    let config = getConfig('amazon.com');
    expect(isValidConfig(config)).toEqual(true);

    config = getConfig('forever21.com');
    expect(isValidConfig(config)).toEqual(true);
  });

  it('should return defaults if a site doesn\'t match', () => {
    const { getConfig } = mock.reRequire('./config');
    const config = getConfig('foobarbaz.???');
    expect(config.nameSelector).toEqual('title');
    expect(config.priceSelector).toEqual(null);
    expect(config.thumbnailSelector).toEqual(null);
    expect(config.ignoredResources).toEqual([]);
  });

  it('should merge defaults and product config', () => {
    mock('glob', {
      sync() {
        return ['my-config'];
      }
    });

    mock('my-config', {
      getConfig() {
        return {
          nameSelector: 'custom-name'
        };
      }
    });

    const { getConfig } = mock.reRequire('./config');
    const config = getConfig('foobarbaz.???');
    expect(config.nameSelector).toEqual('custom-name');
    expect(config.priceSelector).toEqual(null);
    expect(config.thumbnailSelector).toEqual(null);
    expect(config.ignoredResources).toEqual([]);
  });
});

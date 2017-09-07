const glob = require('glob');

const defaultConfig = {
  nameSelector: 'title',
  priceSelector: null,
  thumbnailSelector: null,
  ignoredResources: []
};

const getConfig = (url) => {
  const configPaths = glob.sync('./sites/*.js', { cwd: __dirname });
  let config;

  for (let i = 0, length = configPaths.length; i < length; ++i) {
    const configUtil = require(configPaths[i]);
    config = configUtil.getConfig(url);

    if (config) {
      break;
    }
  }

  return Object.assign({}, defaultConfig, config || {});
};

module.exports = {
  getConfig
};

const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('ExternalUrl schema', () => {
  let ExternalUrl;
  let updateDocumentUtil;
  let _externalUrlDefinition;

  beforeEach(() => {
    _externalUrlDefinition = {
      url: 'http://foo.com',
    };
    updateDocumentUtil = mock.reRequire('../utils/update-document');
    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();
    const { externalUrlSchema } = mock.reRequire('./external-url');
    ExternalUrl = mongoose.model('ExternalUrl', externalUrlSchema);
  });

  afterEach(() => {
    delete mongoose.models.ExternalUrl;
    delete mongoose.modelSchemas.ExternalUrl;
    mock.stopAll();
  });

  it('should add a document', () => {
    let externalUrl = new ExternalUrl(_externalUrlDefinition);
    const err = externalUrl.validateSync();
    expect(err).toBeUndefined();
  });

  it('should trim the url', () => {
    _externalUrlDefinition.url = '   foo ';
    let externalUrl = new ExternalUrl(_externalUrlDefinition);
    const err = externalUrl.validateSync();
    expect(err).toBeUndefined();
    expect(externalUrl.url).toEqual('foo');
  });

  it('should be invalid if url is undefined', () => {
    _externalUrlDefinition.url = undefined;
    let externalUrl = new ExternalUrl(_externalUrlDefinition);
    const err = externalUrl.validateSync();
    expect(err.errors.url.properties.type).toEqual('required');
  });

  it('should be invalid if url is too long', () => {
    let url = '';
    for (let i = 0, len = 501; i < len; ++i) {
      url += 'a';
    }

    _externalUrlDefinition.url = url;
    let externalUrl = new ExternalUrl(_externalUrlDefinition);
    const err = externalUrl.validateSync();
    expect(err.errors.url.properties.type).toEqual('maxlength');
  });

  it('should generate timestamps automatically', () => {
    expect(ExternalUrl.schema.paths.dateCreated).toBeDefined();
    expect(ExternalUrl.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    let found = ExternalUrl.schema.plugins.filter((plugin) => {
      return plugin.fn.name === 'MongoDbErrorHandlerPlugin';
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const externalUrl = new ExternalUrl(_externalUrlDefinition);
    const formData = {};

    externalUrl.updateSync(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      externalUrl,
      ['url', 'price'],
      formData
    );
  });
});

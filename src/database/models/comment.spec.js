const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Comment schema', () => {
  let _definition;
  let MockComment;
  let updateDocumentUtil;

  beforeEach(() => {
    _definition = {
      _user: new mongoose.Types.ObjectId(),
    };

    updateDocumentUtil = mock.reRequire('../utils/update-document');

    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();

    // Load up a mock model with the schema we wish to test:
    MockComment = mongoose.model(
      'MockComment',
      mock.reRequire('./comment').commentSchema
    );
  });

  afterEach(() => {
    delete mongoose.models.MockComment;
    delete mongoose.modelSchemas.MockComment;
    mock.stopAll();
  });

  it('should validate the document', () => {
    const comment = new MockComment(_definition);
    const err = comment.validateSync();
    expect(err).toBeUndefined();
  });

  it('should fail if _user not defined', () => {
    _definition._user = undefined;
    const comment = new MockComment(_definition);
    const err = comment.validateSync();
    expect(err.errors._user.properties.type).toEqual('required');
    expect(err.errors._user.message).toEqual('A user ID must be provided.');
  });

  it('should fail if body has more characters than allowed', () => {
    let test = '';
    while (test.length < 2001) {
      test += '.';
    }

    _definition.body = test;

    const comment = new MockComment(_definition);
    const err = comment.validateSync();

    expect(err.errors.body.properties.type).toEqual('maxlength');
    expect(err.errors.body.message).toEqual(
      'Comments cannot be longer than 2000 characters.'
    );
  });

  it('should generate timestamps automatically', () => {
    expect(MockComment.schema.paths.dateCreated).toBeDefined();
    expect(MockComment.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    const found = MockComment.schema.plugins.filter((plugin) => {
      return plugin.fn.name === 'MongoDbErrorHandlerPlugin';
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const comment = new MockComment(_definition);
    const formData = {};

    comment.updateSync(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      comment,
      ['body'],
      formData
    );
  });
});

const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Message schema', () => {
  let _definition;
  let MockMessage;
  let updateDocumentUtil;

  beforeEach(() => {
    _definition = {
      _user: new mongoose.Types.ObjectId()
    };

    updateDocumentUtil = mock.reRequire('../utils/update-document');

    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();

    // Load up a mock model with the schema we wish to test:
    MockMessage = mongoose.model('MockMessage', mock.reRequire('./message').messageSchema);
  });

  afterEach(() => {
    delete mongoose.models.MockMessage;
    delete mongoose.modelSchemas.MockMessage;
    mock.stopAll();
  });

  it('should validate the document', () => {
    const message = new MockMessage(_definition);
    const err = message.validateSync();
    expect(err).toBeUndefined();
  });

  it('should fail if _user not defined', () => {
    _definition._user = undefined;
    const message = new MockMessage(_definition);
    const err = message.validateSync();
    expect(err.errors._user.properties.type).toEqual('required');
    expect(err.errors._user.message).toEqual('A user ID must be provided.');
  });

  it('should fail if body has more characters than allowed', () => {
    let test = '';
    while (test.length < 2001) {
      test += '.';
    }

    _definition.body = test;

    const message = new MockMessage(_definition);
    const err = message.validateSync();

    expect(err.errors.body.properties.type).toEqual('maxlength');
    expect(err.errors.body.message)
      .toEqual('Messages cannot be longer than 2000 characters.');
  });

  it('should generate timestamps automatically', () => {
    expect(MockMessage.schema.paths.dateCreated).toBeDefined();
    expect(MockMessage.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    const found = MockMessage.schema.plugins.filter((plugin) => {
      return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const message = new MockMessage(_definition);
    const formData = {};

    message.updateSync(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      message,
      [
        'body'
      ],
      formData
    );
  });
});

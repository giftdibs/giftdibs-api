const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Dib schema', () => {
  let _dibDefinition;
  let MockDib;
  let updateDocumentUtil;

  beforeEach(() => {
    _dibDefinition = {
      _gift: new mongoose.Types.ObjectId(),
      _user: new mongoose.Types.ObjectId(),
      quantity: 1,
    };

    updateDocumentUtil = mock.reRequire('../utils/update-document');

    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();

    // Load up a mock model with the schema we wish to test:
    MockDib = mongoose.model('MockDib', mock.reRequire('./dib').dibSchema);
  });

  afterEach(() => {
    delete mongoose.models.MockDib;
    delete mongoose.modelSchemas.MockDib;
    mock.stopAll();
  });

  it('should validate the document', () => {
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err).toBeUndefined();
  });

  it('should fail if _user not defined', () => {
    _dibDefinition._user = undefined;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors._user.properties.type).toEqual('required');
    expect(err.errors._user.message).toEqual('A user ID must be provided.');
  });

  it('should fail if quantity not defined', () => {
    _dibDefinition.quantity = undefined;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors.quantity.properties.type).toEqual('required');
    expect(err.errors.quantity.message).toEqual(
      "The dib's quantity must be provided."
    );
  });

  it('should fail if notes has more characters than allowed', () => {
    let test = '';
    while (test.length < 1001) {
      test += '.';
    }

    _dibDefinition.notes = test;

    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();

    expect(err.errors.notes.properties.type).toEqual('maxlength');
    expect(err.errors.notes.message).toEqual(
      'Notes cannot be longer than 1000 characters.'
    );
  });

  it('should fail if the pricePaid is less than zero', () => {
    _dibDefinition.pricePaid = -1;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors.pricePaid.properties.type).toEqual('min');
    expect(err.errors.pricePaid.message).toEqual(
      'The price paid must be at least zero.'
    );
  });

  it('should fail if the pricePaid is greater than one trillion', () => {
    _dibDefinition.pricePaid = 999999999999999;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors.pricePaid.properties.type).toEqual('max');
    expect(err.errors.pricePaid.message).toEqual(
      'The price paid must be less than 1,000,000,000,000.'
    );
  });

  it('should fail if the quantity is less than one', () => {
    _dibDefinition.quantity = 0;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors.quantity.properties.type).toEqual('min');
    expect(err.errors.quantity.message).toEqual(
      "The dib's quantity must be at least 1."
    );
  });

  it('should fail if the quantity is greater than one trillion', () => {
    _dibDefinition.quantity = 999999999999999;
    const dib = new MockDib(_dibDefinition);
    const err = dib.validateSync();
    expect(err.errors.quantity.properties.type).toEqual('max');
    expect(err.errors.quantity.message).toEqual(
      "The dib's quantity must be less than 1,000,000,000,000."
    );
  });

  it('should generate timestamps automatically', () => {
    expect(MockDib.schema.paths.dateCreated).toBeDefined();
    expect(MockDib.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    const found = MockDib.schema.plugins.filter((plugin) => {
      return plugin.fn.name === 'MongoDbErrorHandlerPlugin';
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const dib = new MockDib(_dibDefinition);
    const formData = {};

    dib.updateSync(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      dib,
      ['isAnonymous', 'notes', 'pricePaid', 'quantity'],
      formData
    );
  });

  it('should update dateDelivered if isDelivered is set in the request', () => {
    const dib = new MockDib(_dibDefinition);
    const formData = {};

    formData.isDelivered = true;
    dib.updateSync(formData);
    expect(dib.dateDelivered instanceof Date).toEqual(true);

    formData.isDelivered = false;
    dib.updateSync(formData);
    expect(dib.dateDelivered).toBeUndefined();
  });
});

const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Gift schema', () => {
  let Gift;
  let updateDocumentUtil;
  let _giftDefinition;

  beforeEach(() => {
    _giftDefinition = {
      _user: new mongoose.Types.ObjectId(),
      _wishList: new mongoose.Types.ObjectId(),
      budget: 1,
      name: 'Foo'
    };
    updateDocumentUtil = mock.reRequire('../utils/update-document');
    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();
    Gift = mock.reRequire('./gift').Gift;
  });

  afterEach(() => {
    delete mongoose.models.Gift;
    delete mongoose.modelSchemas.Gift;
    mock.stopAll();
  });

  it('should validate a document', () => {
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err).toBeUndefined();
  });

  it('should trim the name', () => {
    _giftDefinition.name = '   foo ';
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err).toBeUndefined();
    expect(gift.name).toEqual('foo');
  });

  it('should be invalid if name is undefined', () => {
    _giftDefinition.name = undefined;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.name.properties.type).toEqual('required');
  });

  it('should be invalid if name is too long', () => {
    let name = '';
    for (let i = 0, len = 251; i < len; ++i) {
      name += 'a';
    }

    _giftDefinition.name = name;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.name.properties.type).toEqual('maxlength');
  });

  it('should be invalid if budget is less than zero', () => {
    _giftDefinition.budget = -1;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.budget.properties.type).toEqual('min');
  });

  it('should be invalid if budget is greater than 1 trillion', () => {
    _giftDefinition.budget = 111111111111111;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.budget.properties.type).toEqual('max');
  });

  it('should generate timestamps automatically', () => {
    expect(Gift.schema.paths.dateCreated).toBeDefined();
    expect(Gift.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    let found = Gift.schema.plugins.filter(plugin => {
      return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const gift = new Gift(_giftDefinition);
    const formData = {};

    gift.update(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      gift,
      [
        '_wishList',
        'budget',
        'isReceived',
        'name',
        'orderInWishList',
        'priority',
        'quantity'
      ],
      formData
    );
  });

  it('should be invalid if order is less than zero', () => {
    _giftDefinition.orderInWishList = -1;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.orderInWishList.properties.type).toEqual('min');
  });

  it('should be invalid if priority is less than zero', () => {
    _giftDefinition.priority = -1;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.priority.properties.type).toEqual('min');
  });

  it('should be invalid if priority is greater than 10', () => {
    _giftDefinition.priority = 11;
    let gift = new Gift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.priority.properties.type).toEqual('max');
  });
});

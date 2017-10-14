const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('WishList schema', () => {
  let WishList;
  let updateDocumentUtil;
  let _wishListDefinition;

  beforeEach(() => {
    _wishListDefinition = {
      _user: mongoose.Types.ObjectId(),
      name: 'Foo'
    };
    updateDocumentUtil = mock.reRequire('../utils/update-document');
    spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
    spyOn(console, 'log').and.returnValue();
    WishList = mock.reRequire('./wish-list').WishList;
  });

  afterEach(() => {
    delete mongoose.models.WishList;
    delete mongoose.modelSchemas.WishList;
    mock.stopAll();
  });

  it('should add a wish list record', () => {
    let wishList = new WishList(_wishListDefinition);
    const err = wishList.validateSync();
    expect(err).toBeUndefined();
  });

  it('should trim the name', () => {
    _wishListDefinition.name = '   foo ';
    let wishList = new WishList(_wishListDefinition);
    const err = wishList.validateSync();
    expect(err).toBeUndefined();
    expect(wishList.name).toEqual('foo');
  });

  it('should be invalid if name is undefined', () => {
    _wishListDefinition.name = undefined;
    let wishList = new WishList(_wishListDefinition);
    const err = wishList.validateSync();
    expect(err.errors.name.properties.type).toEqual('required');
  });

  it('should be invalid if name is too long', () => {
    let name = '';
    for (let i = 0, len = 101; i < len; ++i) {
      name += 'a';
    }

    _wishListDefinition.name = name;
    let wishList = new WishList(_wishListDefinition);
    const err = wishList.validateSync();
    expect(err.errors.name.properties.type).toEqual('maxlength');
  });

  it('should be invalid if user is undefined', () => {
    _wishListDefinition._user = undefined;
    let wishList = new WishList(_wishListDefinition);
    const err = wishList.validateSync();
    expect(err.errors._user.properties.type).toEqual('required');
  });

  it('should generate timestamps automatically', () => {
    expect(WishList.schema.paths.dateCreated).toBeDefined();
    expect(WishList.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    let found = WishList.schema.plugins.filter(plugin => {
      return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
    })[0];
    expect(found).toBeDefined();
  });

  it('should update certain fields', () => {
    const wishList = new WishList(_wishListDefinition);
    const formData = {};

    wishList.update(formData);

    expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
      wishList,
      [ 'name' ],
      formData
    );
  });
});

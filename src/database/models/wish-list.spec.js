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
    WishList = mock.reRequire('./wish-list');
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

  it('should get a document by id', (done) => {
    spyOn(WishList, 'find').and.returnValue({
      limit() {
        return Promise.resolve([{ _id: 0 }])
      }
    });
    WishList.getById(0).then((data) => {
      expect(WishList.find).toHaveBeenCalledWith({ _id: 0 });
      expect(data._id).toEqual(0);
      done();
    });
  });

  it('should handle errors with getting a document by id', (done) => {
    spyOn(WishList, 'find').and.returnValue({
      limit() {
        return Promise.resolve([])
      }
    });
    WishList.getById(0).catch((err) => {
      expect(err).toBeDefined();
      expect(err.name).toEqual('WishListNotFoundError');
      done();
    });
  });

  it('should get a gift by id', (done) => {
    spyOn(WishList, 'find').and.returnValue({
      limit() {
        const gifts = {
          id() {
            return { _id: 'giftid' };
          }
        };
        return Promise.resolve([{ _id: 'wishlistid', gifts }])
      }
    });
    WishList.getGiftById('wishlistid', 'giftid').then((data) => {
      expect(WishList.find).toHaveBeenCalledWith({ _id: 'wishlistid' });
      expect(data.wishList._id).toEqual('wishlistid');
      expect(data.gift._id).toEqual('giftid');
      done();
    });
  });

  it('should handle gift not found', (done) => {
    spyOn(WishList, 'find').and.returnValue({
      limit() {
        const gifts = {
          id() {
            return null;
          }
        };
        return Promise.resolve([{ _id: 'wishlistid', gifts }])
      }
    });

    WishList.getGiftById('wishlistid', 'giftid').catch((err) => {
      expect(err).toBeDefined();
      expect(err.name).toEqual('GiftNotFoundError');
      done();
    });
  });
});

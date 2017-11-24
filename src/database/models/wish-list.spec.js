const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('WishList schema', () => {
  describe('fields', () => {
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

    it('should validate a document', () => {
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
      let found = WishList.schema.plugins.filter((plugin) => {
        return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
      })[0];
      expect(found).toBeDefined();
    });

    it('should update certain fields', () => {
      const wishList = new WishList(_wishListDefinition);
      const formData = {};

      wishList.updateSync(formData);

      expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
        wishList,
        [ 'name' ],
        formData
      );
    });
  });

  describe('remove referenced documents', () => {
    const { MockGift } = require('../../shared/testing');

    beforeEach(() => {
      delete mongoose.models.WishList;
      delete mongoose.modelSchemas.WishList;

      MockGift.reset();

      mock('./gift', { Gift: MockGift });
    });

    afterEach(() => {
      mock.stopAll();
    });

    it('should also remove referenced documents', (done) => {
      const gift = new MockGift({});
      const spy = spyOn(gift, 'remove');

      spyOn(MockGift, 'find').and.returnValue(
        Promise.resolve([gift])
      );

      const { removeReferencedDocuments } = mock.reRequire('./wish-list');

      removeReferencedDocuments({}, (err) => {
        expect(spy).toHaveBeenCalledWith();
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockGift, 'find').and.returnValue(
        Promise.reject(
          new Error('Some error')
        )
      );

      const { removeReferencedDocuments } = mock.reRequire('./wish-list');

      removeReferencedDocuments({}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });
});

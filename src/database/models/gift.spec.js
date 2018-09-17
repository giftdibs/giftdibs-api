const mongoose = require('mongoose');
const mock = require('mock-require');

const {
  MockWishList
} = mock.reRequire('../../shared/testing');

mongoose.Promise = Promise;

describe('Gift schema', () => {
  let MockGift;
  let mockUpdateDocumentUtil;
  let _giftDefinition;

  function setupMock() {
    // Load up a mock model with the schema we wish to test:
    MockGift = mongoose.model('MockGift', mock.reRequire('./gift').giftSchema);
  }

  beforeEach(() => {
    _giftDefinition = {
      budget: 1,
      quantity: 1,
      name: 'Foo'
    };

    mockUpdateDocumentUtil = {
      updateDocument() {}
    };

    mock('../utils/update-document', mockUpdateDocumentUtil);

    spyOn(console, 'log').and.returnValue();

    MockWishList.reset();
  });

  afterEach(() => {
    delete mongoose.models.MockGift;
    delete mongoose.modelSchemas.MockGift;
    delete mongoose.models.WishList;
    delete mongoose.modelSchemas.WishList;
    mock.stopAll();
  });

  it('should validate a document', () => {
    setupMock();
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err).toBeUndefined();
  });

  it('should trim the name', () => {
    setupMock();

    _giftDefinition.name = '   foo ';
    const gift = new MockGift(_giftDefinition);
    gift.validate();
    expect(gift.errors).toBeUndefined();
    expect(gift.name).toEqual('foo');
  });

  it('should be invalid if name is undefined', () => {
    setupMock();

    _giftDefinition.name = undefined;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.name.properties.type).toEqual('required');
  });

  it('should be invalid if name is too long', () => {
    setupMock();

    let name = '';
    for (let i = 0, len = 251; i < len; ++i) {
      name += 'a';
    }

    _giftDefinition.name = name;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.name.properties.type).toEqual('maxlength');
  });

  it('should be invalid if budget is less than zero', () => {
    setupMock();

    _giftDefinition.budget = -1;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.budget.properties.type).toEqual('min');
  });

  it('should be invalid if budget is greater than 1 trillion', () => {
    setupMock();

    _giftDefinition.budget = 111111111111111;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.budget.properties.type).toEqual('max');
  });

  it('should generate timestamps automatically', () => {
    setupMock();
    expect(MockGift.schema.paths.dateCreated).toBeDefined();
    expect(MockGift.schema.paths.dateUpdated).toBeDefined();
  });

  it('should update certain fields', () => {
    const spy = spyOn(mockUpdateDocumentUtil, 'updateDocument').and.callThrough();

    setupMock();

    const gift = new MockGift(_giftDefinition);
    const formData = {};

    gift.updateSync(formData);

    expect(spy).toHaveBeenCalledWith(
      gift,
      [
        'budget',
        'isReceived',
        'name',
        'priority',
        'quantity'
      ],
      formData
    );
  });

  it('should replace newlines in the name field', () => {
    const spy = spyOn(mockUpdateDocumentUtil, 'updateDocument').and.callThrough();

    setupMock();

    const gift = new MockGift({
      name: 'old name'
    });
    const formData = {
      name: 'foo\nbar\r\nbaz'
    };

    gift.updateSync(formData);

    expect(spy.calls.first().args[2].name).toEqual('foo bar baz');
  });

  it('should always set quantity to at least (1)', () => {
    const spy = spyOn(mockUpdateDocumentUtil, 'updateDocument').and.callThrough();

    setupMock();

    const gift = new MockGift({
      name: 'Foo',
      quantity: 5
    });

    const formData = {
      quantity: 0
    };

    gift.updateSync(formData);
    expect(spy.calls.first().args[2].quantity).toEqual(1);
    spy.calls.reset();

    formData.quantity = 3;
    gift.updateSync(formData);
    expect(spy.calls.first().args[2].quantity).toEqual(3);
  });

  it('should be invalid if priority is less than zero', () => {
    setupMock();

    _giftDefinition.priority = -1;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.priority.properties.type).toEqual('min');
  });

  it('should be invalid if priority is greater than 10', () => {
    setupMock();

    _giftDefinition.priority = 11;
    const gift = new MockGift(_giftDefinition);
    const err = gift.validateSync();
    expect(err.errors.priority.properties.type).toEqual('max');
  });

  it('should move gift to different wish list', (done) => {
    mock('./wish-list', {
      WishList: MockWishList
    });

    setupMock();

    const oldWishListId = 'oldwishlistid';
    const newWishListId = 'newwishlistid';
    const userId = 'userid';
    const gift = new MockGift({});

    const spy = spyOn(MockWishList, 'findAuthorized').and.returnValue(
      Promise.resolve([
        new MockWishList({
          _id: oldWishListId,
          gifts: [
            gift
          ]
        }),
        new MockWishList({
          _id: newWishListId
        })
      ])
    );

    gift.moveToWishList(newWishListId, userId)
      .then((result) => {
        expect(result.gift).toBeDefined();
        expect(result.wishListIds[0]).toEqual(oldWishListId);
        expect(result.wishListIds[1]).toEqual(newWishListId);
        expect(spy).toHaveBeenCalledWith(
          'userid',
          {
            $or: [
              { _id: 'newwishlistid' },
              { 'gifts._id': gift._id }
            ]
          },
          true
        );
        done();
      })
      .catch(done.fail);
  });

  it('should not move gift if new wish list ID matches current wish list ID', (done) => {
    mock('./wish-list', {
      WishList: MockWishList
    });

    setupMock();

    const wishListId = 'wishlistid';
    const userId = 'userid';
    const gift = new MockGift({});

    spyOn(MockWishList, 'findAuthorized').and.returnValue(
      Promise.resolve(
        [
          new MockWishList({
            _id: wishListId,
            gifts: [
              gift
            ]
          })
        ]
      )
    );

    gift.moveToWishList(wishListId, userId)
      .then((result) => {
        expect(result.gift).toBeDefined();
        expect(result.wishListIds).toBeUndefined();
        done();
      })
      .catch(done.fail);
  });
});

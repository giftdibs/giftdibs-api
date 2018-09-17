const mock = require('mock-require');

const {
  MockWishList,
  MockRequest,
  MockResponse,
  tick
} = require('../../shared/testing');

describe('Gifts router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockWishList.reset();

    _req = new MockRequest({
      user: {},
      params: {
        giftId: 'giftid'
      }
    });

    _res = new MockResponse();

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });

    mock('../../database/models/wish-list', {
      WishList: MockWishList
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./index');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /gifts', () => {
    it('should get a gift by id', (done) => {
      const { getGift } = mock.reRequire('./get');

      const spy = spyOn(MockWishList, 'findAuthorizedByGiftId').and.returnValue(
        Promise.resolve(
          new MockWishList({
            name: 'Dave',
            gifts: [
              {
                _id: 'giftid',
                name: 'foo'
              }
            ]
          })
        )
      );

      _req.params.giftId = 'giftid';
      _req.user._id = 'userid';

      getGift(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith('giftid', 'userid');
        expect(_res.json.output.data.gift.name).toEqual('foo');
        expect(_res.json.output.data.gift.id).toEqual('giftid');
        done();
      });
    });

    it('should handle errors', (done) => {
      const { getGift } = mock.reRequire('./get');

      spyOn(MockWishList, 'findAuthorizedByGiftId').and.returnValue(
        Promise.reject(
          new Error('Some error')
        )
      );

      _req.params.giftId = 'giftid';
      _req.user._id = 'userid';

      getGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('POST /gifts', () => {
    it('should create a gift', (done) => {
      const mockWishList = new MockWishList({
        _id: 'wishlistid',
        gifts: []
      });

      const createSpy = spyOn(mockWishList.gifts, 'create').and.callThrough();
      const saveSpy = spyOn(mockWishList, 'save').and.callThrough();
      const ownershipSpy = spyOn(MockWishList, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(mockWishList)
      );

      const { createGift } = mock.reRequire('./post');

      _req.body.wishListId = 'wishlistid';
      _req.body.name = 'New gift';
      _req.user._id = 'userid';

      createGift(_req, _res, () => {});

      tick(() => {
        const newGift = createSpy.calls.first().returnValue;
        expect(newGift.name).toEqual('New gift');
        expect(newGift._id).toEqual(_res.json.output.data.giftId);
        expect(ownershipSpy).toHaveBeenCalledWith('wishlistid', 'userid');
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should fail if wish list ID not provided', (done) => {
      const { createGift } = mock.reRequire('./post');

      _req.body.wishListId = undefined;

      createGift(_req, _res, (err) => {
        expect(err.name).toEqual('GiftValidationError');
        expect(err.message).toEqual('Please provide a wish list ID.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'confirmUserOwnership').and.returnValue(
        Promise.reject(
          new Error('Some error')
        )
      );

      const { createGift } = mock.reRequire('./post');

      _req.body.wishListId = 'wishlistid';

      createGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      const error = new Error('Some error');
      error.name = 'ValidationError';

      spyOn(MockWishList, 'confirmUserOwnership').and.returnValue(
        Promise.reject(error)
      );

      const { createGift } = mock.reRequire('./post');

      _req.body.wishListId = 'wishlistid';

      createGift(_req, _res, (err) => {
        expect(err.name).toEqual('GiftValidationError');
        done();
      });
    });
  });

  describe('DELETE /gifts/:giftId', () => {
    it('should delete a gift', (done) => {
      const mockWishList = new MockWishList({
        _id: 'wishlistid',
        gifts: [
          {
            _id: 'giftid'
          }
        ]
      });

      const ownershipSpy = spyOn(MockWishList, 'confirmUserOwnershipByGiftId').and.returnValue(
        Promise.resolve(mockWishList)
      );

      const removeSpy = spyOn(mockWishList.gifts[0], 'remove').and.callThrough();

      _req.params.giftId = 'giftid';
      _req.user._id = 'userid';

      const { deleteGift } = mock.reRequire('./delete');

      deleteGift(_req, _res, () => { });

      tick(() => {
        expect(ownershipSpy).toHaveBeenCalledWith('giftid', 'userid');
        expect(removeSpy).toHaveBeenCalledWith();
        expect(_res.json.output.message).toEqual('Gift successfully deleted.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'confirmUserOwnershipByGiftId').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { deleteGift } = mock.reRequire('./delete');

      deleteGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('PATCH /gifts/:giftId', () => {
    it('should update a gift', (done) => {
      const mockWishList = new MockWishList({
        _id: 'wishlistid',
        gifts: [
          {
            _id: 'giftid'
          }
        ]
      });

      const ownershipSpy = spyOn(MockWishList, 'confirmUserOwnershipByGiftId').and.returnValue(
        Promise.resolve(mockWishList)
      );

      const updateSpy = spyOn(mockWishList.gifts[0], 'updateSync').and.callThrough();
      const saveSpy = spyOn(mockWishList, 'save').and.callThrough();

      _req.params.giftId = 'giftid';
      _req.body.name = 'Updated name';
      _req.user._id = 'userid';

      const { updateGift } = mock.reRequire('./patch');

      updateGift(_req, _res, () => {});

      tick(() => {
        expect(ownershipSpy).toHaveBeenCalledWith('giftid', 'userid');
        expect(updateSpy).toHaveBeenCalledWith(_req.body);
        expect(_res.json.output.data.giftId).toEqual('giftid');
        expect(_res.json.output.data.wishListds).toBeUndefined();
        expect(_res.json.output.message).toEqual('Gift successfully updated.');
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'confirmUserOwnershipByGiftId').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { updateGift } = mock.reRequire('./patch');

      updateGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });
});

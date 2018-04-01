const mock = require('mock-require');

const {
  MockGift,
  MockWishList,
  MockRequest,
  MockResponse,
  tick
} = require('../../shared/testing');

describe('Gifts router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockGift.reset();
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
    mock('../../database/models/gift', { Gift: MockGift });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./index');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /gifts', () => {
    it('should get an unsorted array of all gifts', (done) => {
      const { getGifts } = mock.reRequire('./get');

      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockGift({
            _wishList: 'wishlistid',
            name: 'foo',
            orderInWishList: 1
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'bar',
            orderInWishList: 0
          })
        ]);
      };

      getGifts(_req, _res, () => { });

      tick(() => {
        expect(Array.isArray(_res.json.output.gifts)).toEqual(true);
        expect(_res.json.output.gifts[0].name).toEqual('foo');
        done();
      });
    });

    it('should get an array of all gifts in a wish list, ordered', (done) => {
      const { getGifts } = mock.reRequire('./get');

      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockGift({
            _wishList: 'wishlistid',
            name: 'd',
            orderInWishList: 2
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'a',
            orderInWishList: 0
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'e'
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'c',
            orderInWishList: 1
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'b',
            orderInWishList: 0
          }),
          new MockGift({
            _wishList: 'wishlistid',
            name: 'f'
          })
        ]);
      };

      _req.query.wishListId = 'wishlistid';

      getGifts(_req, _res, () => { });

      tick(() => {
        const gifts = _res.json.output.gifts;
        expect(gifts[0].name).toEqual('a');
        expect(gifts[1].name).toEqual('b');
        expect(gifts[2].name).toEqual('c');
        expect(gifts[3].name).toEqual('d');
        expect(gifts[4].name).toEqual('e');
        expect(gifts[5].name).toEqual('f');
        done();
      });
    });

    it('should handle wish list not found', (done) => {
      const { getGifts } = mock.reRequire('./get');

      MockWishList.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      _req.query.wishListId = 'wishlistid';

      getGifts(_req, _res, (err) => {
        expect(err.name).toEqual('WishListNotFoundError');
        done();
      });
    });

    it('should handle errors', (done) => {
      const { getGifts } = mock.reRequire('./get');

      MockGift.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      getGifts(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('POST /gifts', () => {
    it('should create a gift', (done) => {
      MockGift.overrides.save.returnWith = () => Promise.resolve({
        _id: 'newgiftid'
      });

      const { createGift } = mock.reRequire('./post');

      _req.body.name = 'New gift';

      createGift(_req, _res, () => { });

      tick(() => {
        expect(_res.json.output.giftId).toEqual('newgiftid');
        expect(MockGift.lastTouched.name).toEqual('New gift');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockGift.overrides.save.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const { createGift } = mock.reRequire('./post');

      createGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      MockGift.overrides.save.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };

      const { createGift } = mock.reRequire('./post');

      createGift(_req, _res, (err) => {
        expect(err.name).toEqual('GiftValidationError');
        done();
      });
    });
  });

  describe('DELETE /gifts/:giftId', () => {
    it('should delete a gift', (done) => {
      const gift = new MockGift({});
      const spy = spyOn(gift, 'remove');

      spyOn(MockGift, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(gift)
      );

      _req.params.giftId = 'giftid';

      const { deleteGift } = mock.reRequire('./delete');

      deleteGift(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.message).toEqual('Gift successfully deleted.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockGift, 'confirmUserOwnership').and.returnValue(
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
      const gift = new MockGift({
        name: 'Old name',
        _id: 'giftid'
      });

      const updateSpy = spyOn(gift, 'updateSync');
      const saveSpy = spyOn(gift, 'save');

      spyOn(MockGift, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(gift)
      );

      spyOn(MockGift, 'find').and.returnValue({
        limit: () => {
          return Promise.resolve([gift]);
        }
      });

      _req.params.giftId = 'giftid';
      _req.body.name = 'Updated name';

      const { updateGift } = mock.reRequire('./patch');

      updateGift(_req, _res, () => {});

      tick(() => {
        expect(updateSpy).toHaveBeenCalledWith(_req.body);
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockGift, 'confirmUserOwnership').and.returnValue(
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

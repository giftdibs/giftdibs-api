const mock = require('mock-require');
const { MockWishList, MockRequest } = require('../shared/testing');

describe('Confirm user owns wish list middleware', () => {
  let _req;

  beforeEach(() => {
    MockWishList.reset();

    mock('../database/models/wish-list', { WishList: MockWishList });

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        wishListId: 'wishlistid'
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should fail if session doesn\'t own resource', () => {
    const {
      confirmUserOwnsWishList
    } = mock.reRequire('./confirm-user-owns-wish-list');

    MockWishList.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'baz'
    }]);

    const next = (err) => {
      expect(err.name).toEqual('WishListPermissionError');
    };

    confirmUserOwnsWishList(_req, null, next);
  });

  it('should continue if the session does own the resource', (done) => {
    const {
      confirmUserOwnsWishList
    } = mock.reRequire('./confirm-user-owns-wish-list');

    MockWishList.overrides.find.returnWith = () => Promise.resolve([{
      _user: 'userid'
    }]);

    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };

    confirmUserOwnsWishList(_req, null, next);
  });

  it('should handle errors', (done) => {
    const {
      confirmUserOwnsWishList
    } = mock.reRequire('./confirm-user-owns-wish-list');

    MockWishList.overrides.find.returnWith = () => Promise.reject(new Error());

    const next = (err) => {
      expect(err.name).toEqual('Error');
      done();
    };

    confirmUserOwnsWishList(_req, null, next);
  });

  it('should handle wish list not found error', (done) => {
    const {
      confirmUserOwnsWishList
    } = mock.reRequire('./confirm-user-owns-wish-list');

    MockWishList.overrides.find.returnWith = () => Promise.resolve([]);

    const next = (err) => {
      expect(err.name).toEqual('WishListNotFoundError');
      done();
    };

    confirmUserOwnsWishList(_req, null, next);
  });

  it('should fail if the wish list ID is not provided', () => {
    const {
      confirmUserOwnsWishList
    } = mock.reRequire('./confirm-user-owns-wish-list');

    _req.params.wishListId = undefined;
    _req.body._wishList = undefined;

    const next = (err) => {
      expect(err.name).toEqual('WishListNotFoundError');
    };

    confirmUserOwnsWishList(_req, null, next);
  });
});

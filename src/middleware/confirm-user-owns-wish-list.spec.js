const mock = require('mock-require');

describe('confirm user owns wishlist middleware', () => {
  let _wishList;
  let _req;

  function MockWishList() {}

  function getWishList() {
    return Promise.resolve([_wishList]);
  }

  beforeEach(() => {
    MockWishList.find = function () {
      return {
        limit: () => {
          return {
            lean: () => {
              return getWishList();
            }
          };
        }
      };
    };

    _req = {
      user: {
        _id: {
          equals: () => false
        }
      },
      params: {
        wishListId: 0
      }
    };
  });

  it('should pass an error to the callback if the session does not own the resource', () => {
    _wishList = {
      _user: ''
    };

    mock('../database/models/wish-list', MockWishList);
    const { confirmUserOwnsWishList } = require('./confirm-user-owns-wish-list');
    const next = (err) => {
      expect(err).toBeDefined();
      expect(err.status).toEqual(403);
      expect(err.code).toEqual(103);
    };
    confirmUserOwnsWishList(_req, null, next);
  });

  it('should continue if the session does own the resource', (done) => {
    _wishList = { _user: '' };
    _req.user._id.equals = () => true;

    mock('../database/models/wish-list', MockWishList);
    const { confirmUserOwnsWishList } = require('./confirm-user-owns-wish-list');
    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };
    confirmUserOwnsWishList(_req, null, next);
  });

  it('should handle wish list not found error', (done) => {
    _wishList = undefined;
    _req.user._id.equals = () => true;

    mock('../database/models/wish-list', MockWishList);
    const { confirmUserOwnsWishList } = require('./confirm-user-owns-wish-list');
    const next = (err) => {
      expect(err.name).toEqual('WishListNotFoundError');
      done();
    };
    confirmUserOwnsWishList(_req, null, next);
  });
});

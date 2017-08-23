const mock = require('mock-require');

const { MockWishList, MockRequest, MockResponse, tick } = require('../shared/testing');

describe('/wish-lists/:wishListId/gifts', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockWishList.reset();

    _req = new MockRequest({
      user: {},
      params: {
        wishListId: 0
      }
    });
    _res = new MockResponse();

    mock('../database/models/wish-list', MockWishList);
    // mock('express', {
    //   Router: function () {
    //     return {
    //       use(middleware) { },
    //       route(path) {
    //         return {
    //           get() {},
    //           post() {},
    //           delete() {},
    //           patch() {}
    //         };
    //       }
    //     };
    //   }
    // });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./gifts');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should require the user owns the wishList for all routes', () => {
    const routeDefinition = mock.reRequire('./gifts');
    expect(routeDefinition.middleware.addGift[0].name).toEqual('confirmUserOwnsWishList');
    expect(routeDefinition.middleware.deleteGift[0].name).toEqual('confirmUserOwnsWishList');
    expect(routeDefinition.middleware.updateGift[0].name).toEqual('confirmUserOwnsWishList');
  });

  describe('POST /wish-lists/:wishListId/gifts', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should add a gift to a wish list', () => {
      const routeDefinition = mock.reRequire('./gifts');
      const addGift = routeDefinition.middleware.addGift[1];

      _req.body.name = 'New gift';

      addGift(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.giftId).toEqual('abc123');
        expect(MockWishList.lastCreated.gifts[0].name).toEqual('New gift');
      });
    });
  });

  describe('DELETE /wish-lists/:wishListId/gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should remove a gift from a wish list', () => {});

    it('should handle errors removing gift', () => {});
  });

  describe('PATCH /wish-lists/:wishListId/gifts/:giftId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update a gift in a wish list', () => {});

    it('should handle errors updating a gift', () => {});
  });
});

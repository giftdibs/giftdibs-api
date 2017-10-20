const mock = require('mock-require');

const {
  MockDib,
  MockGift,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('Dibs router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockDib.reset();
    MockGift.reset();

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        dibId: 'dibid'
      }
    });

    _res = new MockResponse();

    mock('../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
    mock('../database/models/dib', { Dib: MockDib });
    mock('../database/models/gift', { Gift: MockGift });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./dibs');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should require the user owns the dib when modifying resource', () => {
    const routeDefinition = mock.reRequire('./dibs');
    expect(routeDefinition.middleware.deleteDib[0].name).toEqual('confirmUserOwnsDib');
    expect(routeDefinition.middleware.updateDib[0].name).toEqual('confirmUserOwnsDib');
  });

  describe('GET /dibs', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get an array of all dibs belonging to user', (done) => {
      const dibs = mock.reRequire('./dibs');
      const getDibs = dibs.middleware.getDibs[0];

      MockDib.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockDib({
            _gift: 'giftid',
            _user: 'userid'
          })
        ]);
      };

      getDibs(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.dibs)).toEqual(true);
        done();
      });
    });

    it('should skip getting all dibs if wish list ID is defined', (done) => {
      const findSpy = spyOn(MockDib, 'find').and.callThrough();
      const dibs = mock.reRequire('./dibs');
      const getDibs = dibs.middleware.getDibs[0];

      _req.query.wishListId = 'wishlistid';

      getDibs(_req, _res, () => {});

      tick(() => {
        expect(findSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should get an array of all dibs in a wish list', (done) => {
      let _dibLookupKey;
      let _giftIds;

      spyOn(MockDib, 'find').and.returnValue({
        where(key) {
          _dibLookupKey = key;
          return {
            in(giftIds) {
              _giftIds = giftIds;
              return {
                populate() {
                  return {
                    lean() {
                      return Promise.resolve([
                        new MockDib({
                          _gift: 'giftid',
                          _user: 'userid'
                        })
                      ]);
                    }
                  };
                }
              };
            }
          };
        }
      });

      mock.stop('../database/models/dib');
      mock('../database/models/dib', { Dib: MockDib });

      const dibs = mock.reRequire('./dibs');
      const getDibs = dibs.middleware.getDibs[1];

      _req.query.wishListId = 'wishlistid';

      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockGift({
            _id: 'giftid1'
          }),
          new MockGift({
            _id: 'giftid2'
          }),
          new MockGift({
            _id: 'giftid3'
          })
        ]);
      };

      getDibs(_req, _res, () => {});

      tick(() => {
        expect(_dibLookupKey).toEqual('_gift');
        expect(_giftIds).toEqual(['giftid1', 'giftid2', 'giftid3']);
        done();
      });
    });

    it('should handle errors', (done) => {
      const dibs = mock.reRequire('./dibs');
      const getDibs = dibs.middleware.getDibs[0];

      MockDib.overrides.find.returnWith = () => Promise.reject(new Error());

      getDibs(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('DELETE /dibs/:dibId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should delete a dib', (done) => {
      spyOn(MockDib, 'remove').and.callThrough();
      _req.params.dibId = 'dibid';

      const routeDefinition = mock.reRequire('./dibs');
      const deleteDib = routeDefinition.middleware.deleteDib[1];

      deleteDib(_req, _res, () => {});

      tick(() => {
        expect(MockDib.remove).toHaveBeenCalledWith({ _id: 'dibid' });
        expect(_res.json.output.message).toEqual('Dib successfully removed.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockDib, 'remove').and.returnValue(Promise.reject(new Error()));
      const routeDefinition = mock.reRequire('./dibs');
      const deleteDib = routeDefinition.middleware.deleteDib[1];

      deleteDib(_req, _res, (err) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  // describe('POST /dibs', () => {
  //   beforeEach(beforeEachCallback);

  //   afterEach(afterEachCallback);

  //   it('should create a gift', (done) => {
  //     MockDib.overrides.save.returnWith = () => Promise.resolve({
  //       _id: 'newdibid'
  //     });
  //     const routeDefinition = mock.reRequire('./dibs');
  //     const addGift = routeDefinition.middleware.addGift[1];

  //     _req.body.name = 'New gift';

  //     addGift(_req, _res, () => { });

  //     tick(() => {
  //       expect(_res.json.output.dibId).toEqual('newdibid');
  //       expect(MockDib.lastTouched.name).toEqual('New gift');
  //       done();
  //     });
  //   });

  //   it('should handle errors', (done) => {
  //     MockDib.overrides.save.returnWith = () => Promise.reject(new Error());
  //     const routeDefinition = mock.reRequire('./dibs');
  //     const addGift = routeDefinition.middleware.addGift[1];

  //     addGift(_req, _res, (err) => {
  //       expect(err).toBeDefined();
  //       done();
  //     });
  //   });

  //   it('should handle validation errors', (done) => {
  //     MockDib.overrides.save.returnWith = () => {
  //       const err = new Error();
  //       err.name = 'ValidationError';
  //       return Promise.reject(err);
  //     };
  //     const routeDefinition = mock.reRequire('./dibs');
  //     const addGift = routeDefinition.middleware.addGift[1];

  //     addGift(_req, _res, (err) => {
  //       expect(err.name).toEqual('GiftValidationError');
  //       done();
  //     });
  //   });
  // });

  // describe('DELETE /dibs/:dibId', () => {
  //   beforeEach(beforeEachCallback);

  //   afterEach(afterEachCallback);

  //   it('should delete a gift', (done) => {
  //     spyOn(MockDib, 'remove').and.callThrough();
  //     _req.params.dibId = 'dibid';

  //     const routeDefinition = mock.reRequire('./dibs');
  //     const deleteDib = routeDefinition.middleware.deleteDib[1];

  //     deleteDib(_req, _res, () => {});

  //     tick(() => {
  //       expect(MockDib.remove).toHaveBeenCalledWith({ _id: 'dibid' });
  //       expect(_res.json.output.message).toEqual('Gift successfully deleted.');
  //       done();
  //     });
  //   });

  //   it('should handle errors', (done) => {
  //     spyOn(MockDib, 'remove').and.returnValue(Promise.reject(new Error()));
  //     const routeDefinition = mock.reRequire('./dibs');
  //     const deleteDib = routeDefinition.middleware.deleteDib[1];

  //     deleteDib(_req, _res, (err) => {
  //       expect(err).toBeDefined();
  //       done();
  //     });
  //   });
  // });

  // describe('PATCH /dibs/:dibId', () => {
  //   beforeEach(beforeEachCallback);

  //   afterEach(afterEachCallback);

  //   it('should update a gift', (done) => {
  //     const gift = new MockDib({
  //       name: 'Old name',
  //       _id: 'dibid'
  //     });

  //     const updateSpy = spyOn(gift, 'update');
  //     const saveSpy = spyOn(gift, 'save');

  //     spyOn(MockDib, 'find').and.returnValue({
  //       limit: () => {
  //         return Promise.resolve([gift]);
  //       }
  //     });

  //     _req.params.dibId = 'dibid';
  //     _req.body.name = 'Updated name';

  //     const routeDefinition = mock.reRequire('./dibs');
  //     const updateGift = routeDefinition.middleware.updateGift[2];

  //     updateGift(_req, _res, () => {});

  //     tick(() => {
  //       expect(updateSpy).toHaveBeenCalledWith(_req.body);
  //       expect(saveSpy).toHaveBeenCalledWith();
  //       done();
  //     });
  //   });

  //   it('should handle errors', (done) => {
  //     spyOn(MockDib, 'find').and.returnValue({
  //       limit: () => {
  //         return Promise.reject(new Error());
  //       }
  //     });

  //     const routeDefinition = mock.reRequire('./dibs');
  //     const updateGift = routeDefinition.middleware.updateGift[2];

  //     updateGift(_req, _res, (err) => {
  //       expect(err).toBeDefined();
  //       done();
  //     });
  //   });
  // });
});

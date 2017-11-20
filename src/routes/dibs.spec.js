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

      MockDib.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      getDibs(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('GET /dibs-recipients', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get formatted array of all dibs belonging to user', (done) => {
      MockDib.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockDib({
            _gift: 'giftid1',
            pricePaid: 10
          }),
          new MockDib({
            _gift: 'giftid2'
          }),
          new MockDib({
            _gift: 'giftid3',
            pricePaid: 3
          }),
          new MockDib({
            _gift: 'giftid4'
          })
        ]);
      };

      spyOn(MockGift, 'find').and.returnValue({
        where() {
          return {
            in() {
              return {
                populate() {
                  return {
                    lean() {
                      return Promise.resolve([
                        new MockGift({
                          _id: 'giftid1',
                          _user: {
                            _id: 'userid1',
                            firstName: 'John',
                            lastName: 'Doe'
                          }
                        }),
                        new MockGift({
                          _id: 'giftid2',
                          _user: {
                            _id: 'userid2',
                            firstName: 'Jane',
                            lastName: 'Do'
                          }
                        }),
                        new MockGift({
                          _id: 'giftid3',
                          _user: {
                            _id: 'userid2',
                            firstName: 'Jane',
                            lastName: 'Do'
                          },
                          budget: 8
                        }),
                        new MockGift({
                          _id: 'giftid4',
                          _user: {
                            _id: 'userid2',
                            firstName: 'Jane',
                            lastName: 'Do'
                          },
                          budget: 12
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

      const dibs = mock.reRequire('./dibs');
      const getDibsRecipients = dibs.middleware.getDibsRecipients[0];

      getDibsRecipients(_req, _res, (err) => { console.log(err); });

      tick(() => {
        const recipients = _res.json.output.recipients;
        expect(Array.isArray(recipients)).toEqual(true);
        expect(recipients.length).toEqual(2);
        expect(recipients[0].firstName).toEqual('John');
        expect(recipients[0].lastName).toEqual('Doe');
        expect(recipients[0].gifts.length).toEqual(1);
        expect(recipients[0].budget).toEqual(10);

        expect(recipients[1].firstName).toEqual('Jane');
        expect(recipients[1].lastName).toEqual('Do');
        expect(recipients[1].gifts.length).toEqual(3);
        expect(recipients[1].budget).toEqual(15);

        done();
      });
    });
  });

  describe('DELETE /dibs/:dibId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should require the user owns the dib', () => {
      const routeDefinition = mock.reRequire('./dibs');
      expect(routeDefinition.middleware.deleteDib[0].name)
        .toEqual('confirmUserOwnsDib');
    });

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
      spyOn(MockDib, 'remove').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const routeDefinition = mock.reRequire('./dibs');
      const deleteDib = routeDefinition.middleware.deleteDib[1];

      deleteDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('PATCH /dibs/:dibId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should require the user owns the dib', () => {
      const routeDefinition = mock.reRequire('./dibs');
      expect(routeDefinition.middleware.updateDib[0].name)
        .toEqual('confirmUserOwnsDib');
    });

    it('should update a dib', (done) => {
      const dib = new MockDib({
        _id: 'dibid'
      });

      const gift = new MockGift({
        quantity: 1
      });

      const updateSpy = spyOn(dib, 'updateSync');
      const saveSpy = spyOn(dib, 'save');

      MockDib.overrides.find.returnWith = () => Promise.resolve([dib]);
      MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

      _req.params.dibId = 'dibid';
      _req.body.pricePaid = 10;

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, () => {});

      tick(() => {
        expect(updateSpy).toHaveBeenCalledWith(_req.body);
        expect(saveSpy).toHaveBeenCalledWith();
        done();
      });
    });

    it('should validate dib quantity against gift quantity', (done) => {
      const dibs = [
        new MockDib({
          _id: 'dibid',
          quantity: 1
        }),
        new MockDib({
          _id: 'dibid1',
          quantity: 1
        })
      ];

      const gift = new MockGift({
        quantity: 5
      });

      MockDib.overrides.find.returnWith = () => Promise.resolve(dibs);
      MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

      _req.params.dibId = 'dibid';
      _req.body.quantity = 1;

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, () => { });

      tick(() => {
        expect(_res.json.output.message).toEqual('Dib successfully updated.');
        done();
      });
    });

    it('should fail if dib quantity is more than gift quantity', (done) => {
      const dibs = [
        new MockDib({
          _id: 'dibid',
          quantity: 1
        }),
        new MockDib({
          _id: 'dibid1',
          quantity: 2
        }),
        new MockDib({
          _id: 'dibid2',
          quantity: 1
        })
      ];

      const gift = new MockGift({
        quantity: 2
      });

      MockDib.overrides.find.returnWith = () => Promise.resolve(dibs);
      MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

      _req.params.dibId = 'dibid';
      _req.body.quantity = 10;

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, (err) => {
        expect(err.name).toEqual('DibValidationError');
        expect(err.errors[0].message)
          .toEqual([
            'Dib quantity is more than are available.',
            'Please choose a smaller amount.'
          ].join(' '));
        done();
      });
    });

    it('should handle gift not found', (done) => {
      MockDib.overrides.find.returnWith = () => Promise.resolve([]);
      MockGift.overrides.find.returnWith = () => Promise.resolve([]);

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, (err) => {
        expect(err.name).toEqual('GiftNotFoundError');
        done();
      });
    });

    it('should handle dib not found error', (done) => {
      MockDib.overrides.find.returnWith = () => Promise.resolve([]);
      MockGift.overrides.find.returnWith = () => Promise.resolve([
        new MockGift()
      ]);

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, (err) => {
        expect(err.name).toEqual('DibNotFoundError');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      MockDib.overrides.find.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, (err) => {
        expect(err.name).toEqual('DibValidationError');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockDib.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./dibs');
      const updateDib = routeDefinition.middleware.updateDib[1];

      updateDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('POST /dibs', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should create a dib', (done) => {
      const spy = spyOn(MockDib.prototype, 'save').and.returnValue(
        Promise.resolve({
          _id: 'dibid'
        })
      );

      const routeDefinition = mock.reRequire('./dibs');
      const createDib = routeDefinition.middleware.createDib[2];

      createDib(_req, _res, () => { });

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.dibId).toEqual('dibid');
        done();
      });
    });

    it('should pass if the user does not own the gift', (done) => {
      MockGift.overrides.find.returnWith = () => Promise.resolve([]);

      const routeDefinition = mock.reRequire('./dibs');
      const confirmUserDoesNotOwnGift = routeDefinition.middleware.createDib[0];

      confirmUserDoesNotOwnGift(_req, _res, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should prevent user from creating a dib on their own gift', (done) => {
      MockGift.overrides.find.returnWith = () => {
        return Promise.resolve([new MockGift()]);
      };

      const routeDefinition = mock.reRequire('./dibs');
      const confirmUserDoesNotOwnGift = routeDefinition.middleware.createDib[0];

      confirmUserDoesNotOwnGift(_req, _res, (err) => {
        expect(err.name).toEqual('DibValidationError');
        expect(err.message).toEqual('You cannot dib your own gift.');
        done();
      });
    });

    it('should handle errors when creating a dib on user\'s gift', (done) => {
      MockGift.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./dibs');
      const confirmUserDoesNotOwnGift = routeDefinition.middleware.createDib[0];

      confirmUserDoesNotOwnGift(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should pass if the user has not dibbed the gift already', (done) => {
      MockDib.overrides.find.returnWith = () => Promise.resolve([]);

      const routeDefinition = mock.reRequire('./dibs');
      const checkAlreadyDibbed = routeDefinition.middleware.createDib[1];

      checkAlreadyDibbed(_req, _res, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should prevent user from creating a dib twice on a gift', (done) => {
      MockDib.overrides.find.returnWith = () => {
        return Promise.resolve([new MockDib()]);
      };

      const routeDefinition = mock.reRequire('./dibs');
      const checkAlreadyDibbed = routeDefinition.middleware.createDib[1];

      checkAlreadyDibbed(_req, _res, (err) => {
        expect(err.name).toEqual('DibValidationError');
        expect(err.message).toEqual('You have already dibbed that gift.');
        done();
      });
    });

    it('should handle errors when a user dibs a gift twice', (done) => {
      MockDib.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./dibs');
      const checkAlreadyDibbed = routeDefinition.middleware.createDib[1];

      checkAlreadyDibbed(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      MockDib.overrides.save.returnWith = () => {
        const err = new Error();
        err.name = 'ValidationError';
        return Promise.reject(err);
      };

      const routeDefinition = mock.reRequire('./dibs');
      const createDib = routeDefinition.middleware.createDib[2];

      createDib(_req, _res, (err) => {
        expect(err.name).toEqual('DibValidationError');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockDib.overrides.save.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./dibs');
      const createDib = routeDefinition.middleware.createDib[2];

      createDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });
});

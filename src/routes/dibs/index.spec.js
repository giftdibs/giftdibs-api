const mock = require('mock-require');

const {
  MockWishList,
  MockRequest,
  MockResponse,
  tick
} = require('../../shared/testing');

describe('Dibs router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockWishList.reset();

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        dibId: 'dibid'
      }
    });

    _res = new MockResponse();

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
    mock('../../database/models/wish-list', { WishList: MockWishList });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./index');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  // describe('GET /dibs', () => {
  //   it('should get an array of all dibs belonging to user', (done) => {
  //     const { getDibs } = mock.reRequire('./get');

  //     MockDib.overrides.find.returnWith = () => {
  //       return Promise.resolve([
  //         new MockDib({
  //           _gift: 'giftid',
  //           _user: 'userid'
  //         })
  //       ]);
  //     };

  //     _req.query.wishListId = 'wishlistid';

  //     getDibs(_req, _res, () => { });

  //     tick(() => {
  //       expect(Array.isArray(_res.json.output.data.dibs)).toEqual(true);
  //       done();
  //     });
  //   });

  //   it('should require a wish list ID', (done) => {
  //     const { getDibs } = mock.reRequire('./get');

  //     _req.query.wishListId = undefined;

  //     getDibs(_req, _res, (err) => {
  //       expect(err.name).toEqual('DibValidationError');
  //       expect(err.message).toEqual('Please provide a wish list ID.');
  //       done();
  //     });
  //   });

  //   it('should get an array of all dibs in a wish list', (done) => {
  //     let _dibLookupKey;
  //     let _giftIds;

  //     spyOn(MockDib, 'find').and.returnValue({
  //       where(key) {
  //         _dibLookupKey = key;
  //         return {
  //           in(giftIds) {
  //             _giftIds = giftIds;
  //             return {
  //               populate() {
  //                 return {
  //                   lean() {
  //                     return Promise.resolve([
  //                       new MockDib({
  //                         _gift: 'giftid',
  //                         _user: 'userid'
  //                       })
  //                     ]);
  //                   }
  //                 };
  //               }
  //             };
  //           }
  //         };
  //       }
  //     });

  //     mock.stop('../../database/models/dib');
  //     mock('../../database/models/dib', { Dib: MockDib });

  //     _req.query.wishListId = 'wishlistid';

  //     const { getDibs } = mock.reRequire('./get');

  //     _req.query.wishListId = 'wishlistid';

  //     MockGift.overrides.find.returnWith = () => {
  //       return Promise.resolve([
  //         new MockGift({
  //           _id: 'giftid1'
  //         }),
  //         new MockGift({
  //           _id: 'giftid2'
  //         }),
  //         new MockGift({
  //           _id: 'giftid3'
  //         })
  //       ]);
  //     };

  //     getDibs(_req, _res, () => {});

  //     tick(() => {
  //       expect(_dibLookupKey).toEqual('_gift');
  //       expect(_giftIds).toEqual(['giftid1', 'giftid2', 'giftid3']);
  //       done();
  //     });
  //   });

  //   it('should handle errors', (done) => {
  //     const { getDibs } = mock.reRequire('./get');

  //     MockDib.overrides.find.returnWith = () => {
  //       return Promise.reject(new Error('Some error'));
  //     };

  //     _req.query.wishListId = 'wishlistid';

  //     getDibs(_req, _res, (err) => {
  //       expect(err.message).toEqual('Some error');
  //       done();
  //     });
  //   });
  // });

  describe('GET /dibs/recipients', () => {
    it('should get formatted array of all dibs belonging to user', (done) => {
      const sessionUser = {
        _id: 'userid',
        firstName: 'Session',
        lastName: 'User'
      };

      const user1 = {
        _id: 'userid1',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user2 = {
        _id: 'userid2',
        firstName: 'Jane',
        lastName: 'Do'
      };

      spyOn(MockWishList, 'findAuthorized').and.returnValue(
        Promise.resolve([
          new MockWishList({
            _user: user1,
            gifts: [
              {
                _id: 'giftid0',
                dibs: [
                  {
                    _user: sessionUser
                  }
                ]
              }
            ]
          }),
          new MockWishList({
            _user: user1,
            gifts: [
              {
                _id: 'giftid1',
                budget: 20,
                quantity: 3,
                dibs: [
                  {
                    _user: user2,
                    quantity: 1
                  },
                  {
                    _user: sessionUser,
                    quantity: 2,
                    pricePaid: 15
                  }
                ]
              }
            ]
          }),
          new MockWishList({
            _user: user2,
            gifts: [
              {
                _id: 'giftid2',
                budget: 5,
                dibs: [
                  {
                    _user: user1
                  }
                ]
              },
              {
                _id: 'giftid3',
                budget: 8,
                dibs: [
                  {
                    _user: sessionUser,
                    quantity: 3 // dib quantity set, but not gift
                  }
                ]
              },
              {
                _id: 'giftid4',
                budget: 12,
                quantity: 1, // gift quantity set, but not dib
                dibs: [
                  {
                    _user: sessionUser,
                    pricePaid: 10
                  }
                ]
              }
            ]
          })
        ])
      );

      const { getDibsRecipients } = mock.reRequire('./recipients/get');

      getDibsRecipients(_req, _res, () => { });

      tick(() => {
        const recipients = _res.json.output.data.recipients;

        expect(Array.isArray(recipients)).toEqual(true);
        expect(recipients.length).toEqual(2);
        expect(recipients[0].firstName).toEqual('John');
        expect(recipients[0].lastName).toEqual('Doe');
        expect(recipients[0].wishLists.length).toEqual(2);
        expect(recipients[0].wishLists[0].gifts[0].dibs.length).toEqual(1);
        expect(recipients[0].wishLists[1].gifts[0].dibs.length).toEqual(1);
        expect(recipients[0].totalBudgeted).toEqual(20);
        expect(recipients[0].totalPricePaid).toEqual(15);

        expect(recipients[1].firstName).toEqual('Jane');
        expect(recipients[1].lastName).toEqual('Do');
        expect(recipients[1].wishLists.length).toEqual(1);
        expect(recipients[0].wishLists[0].gifts[0].dibs.length).toEqual(1);
        expect(recipients[0].wishLists[1].gifts[0].dibs.length).toEqual(1);
        expect(recipients[1].totalBudgeted).toEqual(20);
        expect(recipients[1].totalPricePaid).toEqual(10);

        done();
      });
    });
  });

  describe('DELETE /dibs/:dibId', () => {
    it('should delete a dib', (done) => {
      const spy = spyOn(MockWishList, 'removeDibById').and.callThrough();

      _req.user._id = 'userid';
      _req.params.dibId = 'dibid';

      const { deleteDib } = mock.reRequire('./delete');

      deleteDib(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith('dibid', 'userid');
        expect(_res.json.output.message).toEqual('Dib successfully removed.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'removeDibById').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { deleteDib } = mock.reRequire('./delete');

      deleteDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('PATCH /dibs/:dibId', () => {
    it('should patch a dib', (done) => {
      const spy = spyOn(MockWishList, 'updateDibById').and.callThrough();

      _req.user._id = 'userid';
      _req.params.dibId = 'dibid';
      _req.body = {
        foo: 'bar'
      };

      const { updateDib } = mock.reRequire('./patch');

      updateDib(_req, _res, () => {});

      tick(() => {
        expect(spy).toHaveBeenCalledWith('dibid', 'userid', {
          foo: 'bar'
        });
        expect(_res.json.output.message).toEqual('Dib successfully updated.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'updateDibById').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { updateDib } = mock.reRequire('./patch');

      updateDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    // it('should handle user not owning the dib', () => {
    //   spyOn(MockDib, 'confirmUserOwnership').and.returnValue(
    //     Promise.reject(new Error('Some error'))
    //   );

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, (err) => {
    //     expect(err.message).toEqual('Some error');
    //   });
    // });

    // it('should update a dib', (done) => {
    //   const dib = new MockDib({
    //     _id: 'dibid'
    //   });

    //   const gift = new MockGift({
    //     quantity: 1
    //   });

    //   spyOn(MockDib, 'confirmUserOwnership').and.returnValue(
    //     Promise.resolve(dib)
    //   );

    //   const updateSpy = spyOn(dib, 'updateSync');
    //   const saveSpy = spyOn(dib, 'save');

    //   MockDib.overrides.find.returnWith = () => Promise.resolve([dib]);
    //   MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

    //   _req.params.dibId = 'dibid';
    //   _req.body.pricePaid = 10;

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, () => { });

    //   tick(() => {
    //     expect(updateSpy).toHaveBeenCalledWith(_req.body);
    //     expect(saveSpy).toHaveBeenCalledWith();
    //     done();
    //   });
    // });

    // it('should validate dib quantity against gift quantity', (done) => {
    //   const dibs = [
    //     new MockDib({
    //       _id: 'dibid',
    //       quantity: 1
    //     }),
    //     new MockDib({
    //       _id: 'dibid1',
    //       quantity: 1
    //     })
    //   ];

    //   const gift = new MockGift({
    //     quantity: 5
    //   });

    //   MockDib.overrides.find.returnWith = () => Promise.resolve(dibs);
    //   MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

    //   _req.params.dibId = 'dibid';
    //   _req.body.quantity = 1;

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, () => { });

    //   tick(() => {
    //     expect(_res.json.output.message)
    //      .toEqual('Dib successfully updated.');
    //     done();
    //   });
    // });

    // it('should fail if dib quantity is more than gift quantity', (done) => {
    //   const dibs = [
    //     new MockDib({
    //       _id: 'dibid',
    //       quantity: 1
    //     }),
    //     new MockDib({
    //       _id: 'dibid1',
    //       quantity: 2
    //     }),
    //     new MockDib({
    //       _id: 'dibid2',
    //       quantity: 1
    //     })
    //   ];

    //   const gift = new MockGift({
    //     quantity: 2
    //   });

    //   MockDib.overrides.find.returnWith = () => Promise.resolve(dibs);
    //   MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

    //   _req.params.dibId = 'dibid';
    //   _req.body.quantity = 10;

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('DibValidationError');
    //     expect(err.errors[0].message)
    //       .toEqual([
    //         'Dib quantity is more than are available.',
    //         'Please choose a smaller amount.'
    //       ].join(' '));
    //     done();
    //   });
    // });

    // it('should handle gift not found', (done) => {
    //   MockDib.overrides.find.returnWith = () => Promise.resolve([]);
    //   MockGift.overrides.find.returnWith = () => Promise.resolve([]);

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('GiftNotFoundError');
    //     done();
    //   });
    // });

    // it('should handle validation errors', (done) => {
    //   MockDib.overrides.find.returnWith = () => {
    //     const err = new Error();
    //     err.name = 'ValidationError';
    //     return Promise.reject(err);
    //   };

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('DibValidationError');
    //     done();
    //   });
    // });

    // it('should handle errors', (done) => {
    //   MockDib.overrides.find.returnWith = () => {
    //     return Promise.reject(new Error('Some error'));
    //   };

    //   const { updateDib } = mock.reRequire('./patch');

    //   updateDib(_req, _res, (err) => {
    //     expect(err.message).toEqual('Some error');
    //     done();
    //   });
    // });
  });

  describe('POST /dibs', () => {
    it('should create a dib', (done) => {
      const createSpy = spyOn(MockWishList, 'createDib').and.returnValue(
        Promise.resolve('dibid')
      );

      const { createDib } = mock.reRequire('./post');

      _req.body = {
        quantity: 5
      };

      createDib(_req, _res, () => { });

      tick(() => {
        expect(createSpy).toHaveBeenCalledWith({
          quantity: 5
        }, 'userid');
        expect(_res.json.output.data.dibId).toEqual('dibid');
        done();
      });
    });

    it('should catch errors', (done) => {
      spyOn(MockWishList, 'createDib').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { createDib } = mock.reRequire('./post');

      createDib(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    // it('should prevent user from creating a dib on their own gift',
    // (done) => {
    //   MockGift.overrides.find.returnWith = () => {
    //     return Promise.resolve([new MockGift()]);
    //   };

    //   const { createDib } = mock.reRequire('./post');

    //   createDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('DibValidationError');
    //     expect(err.message).toEqual('You cannot dib your own gift.');
    //     done();
    //   });
    // });

    // it('should handle errors when creating a dib on user\'s gift',
    // (done) => {
    //   MockGift.overrides.find.returnWith = () => {
    //     return Promise.reject(new Error('Some error'));
    //   };

    //   const { createDib } = mock.reRequire('./post');

    //   createDib(_req, _res, (err) => {
    //     expect(err.message).toEqual('Some error');
    //     done();
    //   });
    // });

    // it('should prevent user from creating a dib twice on a gift', (done) => {
    //   MockGift.overrides.find.returnWith = () => {
    //     MockGift.overrides.find.returnWith = () => Promise.resolve([
    //       new MockGift({})
    //     ]);

    //     return Promise.resolve([]);
    //   };

    //   MockDib.overrides.find.returnWith = () => {
    //     return Promise.resolve([
    //       new MockDib({})
    //     ]);
    //   };

    //   const { createDib } = mock.reRequire('./post');

    //   createDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('DibValidationError');
    //     expect(err.message).toEqual('You have already dibbed that gift.');
    //     done();
    //   });
    // });

    // it('should handle validation errors', (done) => {
    //   MockDib.overrides.save.returnWith = () => {
    //     const err = new Error();
    //     err.name = 'ValidationError';
    //     return Promise.reject(err);
    //   };

    //   const { createDib } = mock.reRequire('./post');

    //   createDib(_req, _res, (err) => {
    //     expect(err.name).toEqual('DibValidationError');
    //     done();
    //   });
    // });
  });
});

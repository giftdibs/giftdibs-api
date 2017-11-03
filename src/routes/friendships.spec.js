const mock = require('mock-require');

const {
  MockFriendship,
  MockRequest,
  MockResponse,
  tick
} = require('../shared/testing');

describe('Friendships router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockFriendship.reset();

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        friendshipId: 'friendshipid'
      }
    });

    _res = new MockResponse();

    mock('../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
    mock('../database/models/friendship', { Friendship: MockFriendship });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const routeDefinition = mock.reRequire('./friendships');
    expect(routeDefinition.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /friendships', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should get an array of all friendships', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockFriendship({
            _friend: 'friendid',
            _user: 'userid'
          })
        ]);
      };

      getFriendships(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        done();
      });
    });

    it('should get an array of all friendships belonging to a user', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockFriendship({
            _friend: 'friendid',
            _user: 'userid'
          })
        ]);
      };

      _req.query.userId = 'userid';

      getFriendships(_req, _res, () => {});

      tick(() => {
        expect(Array.isArray(_res.json.output.friendships)).toEqual(true);
        expect(_res.json.output.authResponse).toBeDefined();
        expect(Array.isArray(MockFriendship.overrides.find.lastQuery.$or)).toEqual(true);
        expect(MockFriendship.overrides.find.lastQuery.$or[0]._user).toEqual('userid');
        done();
      });
    });

    it('should handle errors', (done) => {
      const friendships = mock.reRequire('./friendships');
      const getFriendships = friendships.middleware.getFriendships[0];

      MockFriendship.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      getFriendships(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  // describe('GET /friendships-recipients', () => {
  //   beforeEach(beforeEachCallback);

  //   afterEach(afterEachCallback);

  //   it('should get an array of all friendships belonging to user, formatted', (done) => {
  //     MockFriendship.overrides.find.returnWith = () => {
  //       return Promise.resolve([
  //         new MockFriendship({
  //           _gift: 'giftid1',
  //           pricePaid: 10
  //         }),
  //         new MockFriendship({
  //           _gift: 'giftid2'
  //         }),
  //         new MockFriendship({
  //           _gift: 'giftid3',
  //           pricePaid: 3
  //         }),
  //         new MockFriendship({
  //           _gift: 'giftid4'
  //         })
  //       ]);
  //     };

  //     spyOn(MockGift, 'find').and.returnValue({
  //       where() {
  //         return {
  //           in() {
  //             return {
  //               populate() {
  //                 return {
  //                   lean() {
  //                     return Promise.resolve([
  //                       new MockGift({
  //                         _id: 'giftid1',
  //                         _user: {
  //                           _id: 'userid1',
  //                           firstName: 'John',
  //                           lastName: 'Doe'
  //                         }
  //                       }),
  //                       new MockGift({
  //                         _id: 'giftid2',
  //                         _user: {
  //                           _id: 'userid2',
  //                           firstName: 'Jane',
  //                           lastName: 'Do'
  //                         }
  //                       }),
  //                       new MockGift({
  //                         _id: 'giftid3',
  //                         _user: {
  //                           _id: 'userid2',
  //                           firstName: 'Jane',
  //                           lastName: 'Do'
  //                         },
  //                         budget: 8
  //                       }),
  //                       new MockGift({
  //                         _id: 'giftid4',
  //                         _user: {
  //                           _id: 'userid2',
  //                           firstName: 'Jane',
  //                           lastName: 'Do'
  //                         },
  //                         budget: 12
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

  //     const friendships = mock.reRequire('./friendships');
  //     const getFriendshipsRecipients = friendships.middleware.getFriendshipsRecipients[0];

  //     getFriendshipsRecipients(_req, _res, (err) => { console.log(err); });

  //     tick(() => {
  //       const recipients = _res.json.output.recipients;
  //       expect(Array.isArray(recipients)).toEqual(true);
  //       expect(recipients.length).toEqual(2);
  //       expect(recipients[0].firstName).toEqual('John');
  //       expect(recipients[0].lastName).toEqual('Doe');
  //       expect(recipients[0].gifts.length).toEqual(1);
  //       expect(recipients[0].budget).toEqual(10);

  //       expect(recipients[1].firstName).toEqual('Jane');
  //       expect(recipients[1].lastName).toEqual('Do');
  //       expect(recipients[1].gifts.length).toEqual(3);
  //       expect(recipients[1].budget).toEqual(15);

  //       done();
  //     });
  //   });
  // });

  describe('DELETE /friendships/:friendshipId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should require the user owns the friendship', () => {
      const routeDefinition = mock.reRequire('./friendships');
      expect(routeDefinition.middleware.deleteFriendship[0].name).toEqual('confirmUserOwnsFriendship');
    });

    it('should delete a friendship', (done) => {
      spyOn(MockFriendship, 'remove').and.callThrough();

      _req.params.friendshipId = 'friendshipid';

      const routeDefinition = mock.reRequire('./friendships');
      const deleteFriendship = routeDefinition.middleware.deleteFriendship[1];

      deleteFriendship(_req, _res, () => {});

      tick(() => {
        expect(MockFriendship.remove).toHaveBeenCalledWith({ _id: 'friendshipid' });
        expect(_res.json.output.message).toEqual('Friendship successfully deleted.');
        done();
      });
    });

    it('should handle errors', (done) => {
      spyOn(MockFriendship, 'remove').and.returnValue(Promise.reject(new Error('Some error')));

      const routeDefinition = mock.reRequire('./friendships');
      const deleteFriendship = routeDefinition.middleware.deleteFriendship[1];

      deleteFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  // describe('PATCH /friendships/:friendshipId', () => {
  //   beforeEach(beforeEachCallback);

  //   afterEach(afterEachCallback);

  //   it('should require the user owns the friendship', () => {
  //     const routeDefinition = mock.reRequire('./friendships');
  //     expect(routeDefinition.middleware.updateFriendship[0].name).toEqual('confirmUserOwnsFriendship');
  //   });

  //   it('should update a friendship', (done) => {
  //     const friendship = new MockFriendship({
  //       _id: 'friendshipid'
  //     });

  //     const gift = new MockGift({
  //       quantity: 1
  //     });

  //     const updateSpy = spyOn(friendship, 'update');
  //     const saveSpy = spyOn(friendship, 'save');

  //     MockFriendship.overrides.find.returnWith = () => Promise.resolve([friendship]);
  //     MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

  //     _req.params.friendshipId = 'friendshipid';
  //     _req.body.pricePaid = 10;

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, () => {});

  //     tick(() => {
  //       expect(updateSpy).toHaveBeenCalledWith(_req.body);
  //       expect(saveSpy).toHaveBeenCalledWith();
  //       done();
  //     });
  //   });

  //   it('should validate friendship quantity against gift quantity', (done) => {
  //     const friendships = [
  //       new MockFriendship({
  //         _id: 'friendshipid',
  //         quantity: 1
  //       }),
  //       new MockFriendship({
  //         _id: 'friendshipid1',
  //         quantity: 1
  //       })
  //     ];

  //     const gift = new MockGift({
  //       quantity: 5
  //     });

  //     MockFriendship.overrides.find.returnWith = () => Promise.resolve(friendships);
  //     MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

  //     _req.params.friendshipId = 'friendshipid';
  //     _req.body.quantity = 1;

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, () => { });

  //     tick(() => {
  //       expect(_res.json.output.message).toEqual('Friendship successfully updated.');
  //       done();
  //     });
  //   });

  //   it('should fail if friendship quantity is more than gift quantity', (done) => {
  //     const friendships = [
  //       new MockFriendship({
  //         _id: 'friendshipid',
  //         quantity: 1
  //       }),
  //       new MockFriendship({
  //         _id: 'friendshipid1',
  //         quantity: 2
  //       }),
  //       new MockFriendship({
  //         _id: 'friendshipid2',
  //         quantity: 1
  //       })
  //     ];

  //     const gift = new MockGift({
  //       quantity: 2
  //     });

  //     MockFriendship.overrides.find.returnWith = () => Promise.resolve(friendships);
  //     MockGift.overrides.find.returnWith = () => Promise.resolve([gift]);

  //     _req.params.friendshipId = 'friendshipid';
  //     _req.body.quantity = 10;

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, (err) => {
  //       expect(err.name).toEqual('FriendshipValidationError');
  //       expect(err.errors[0].message).toEqual('Friendship quantity is more than are available. Please choose a smaller amount.');
  //       done();
  //     });
  //   });

  //   it('should handle gift not found', (done) => {
  //     MockFriendship.overrides.find.returnWith = () => Promise.resolve([]);
  //     MockGift.overrides.find.returnWith = () => Promise.resolve([]);

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, (err) => {
  //       expect(err.name).toEqual('GiftNotFoundError');
  //       done();
  //     });
  //   });

  //   it('should handle friendship not found error', (done) => {
  //     MockFriendship.overrides.find.returnWith = () => Promise.resolve([]);
  //     MockGift.overrides.find.returnWith = () => Promise.resolve([
  //       new MockGift()
  //     ]);

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, (err) => {
  //       expect(err.name).toEqual('FriendshipNotFoundError');
  //       done();
  //     });
  //   });

  //   it('should handle errors', (done) => {
  //     MockFriendship.overrides.find.returnWith = () => {
  //       return Promise.reject(new Error('Some error'));
  //     };

  //     const routeDefinition = mock.reRequire('./friendships');
  //     const updateFriendship = routeDefinition.middleware.updateFriendship[1];

  //     updateFriendship(_req, _res, (err) => {
  //       expect(err.message).toEqual('Some error');
  //       done();
  //     });
  //   });
  // });

  describe('POST /friendships', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should create a friendship', (done) => {
      const spy = spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.resolve({
          _id: 'friendshipid'
        })
      );

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, () => { });

      tick(() => {
        expect(spy).toHaveBeenCalledWith();
        expect(_res.json.output.friendshipId).toEqual('friendshipid');
        done();
      });
    });

    it('should validate the friend request', (done) => {
      MockFriendship.overrides.find.returnWith = () => Promise.resolve([]);

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it('should fail if already following the user', (done) => {
      MockFriendship.overrides.find.returnWith = () => Promise.resolve([{}]);

      _req.user._id = 'requser';
      _req.body._friend = 'friendid';

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You are already following that person.');
        done();
      });
    });

    it('should fail if request wants to follow itself', (done) => {
      _req.user._id = 'friendid';
      _req.body._friend = 'friendid';

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[0];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        expect(err.message).toEqual('You cannot follow yourself.');
        done();
      });
    });

    it('should handle errors', (done) => {
      MockFriendship.overrides.save.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle validation errors', (done) => {
      const err = new Error();
      err.name = 'ValidationError';

      spyOn(MockFriendship.prototype, 'save').and.returnValue(
        Promise.reject(err)
      );

      const routeDefinition = mock.reRequire('./friendships');
      const createFriendship = routeDefinition.middleware.createFriendship[1];

      createFriendship(_req, _res, (err) => {
        expect(err.name).toEqual('FriendshipValidationError');
        done();
      });
    });
  });
});

const mock = require('mock-require');

const {
  tick,
  MockUser,
  MockRequest,
  MockResponse
} = require('../../shared/testing');

describe('Users router', () => {
  let _req;
  let _res;

  const beforeEachCallback = () => {
    MockUser.reset();

    _req = new MockRequest({
      user: {
        _id: 'userid'
      },
      params: {
        userId: 'userid'
      }
    });
    _res = new MockResponse();

    mock('../../database/models/user', { User: MockUser });

    mock('../../middleware/auth-response', function authResponse(data) {
      return (req, res, next) => {
        data.authResponse = {};
        res.json(data);
      }
    });
  };

  const afterEachCallback = () => {
    mock.stopAll();
  };

  beforeEach(beforeEachCallback);

  afterEach(afterEachCallback);

  it('should require a jwt for all routes', () => {
    const users = mock.reRequire('./index');
    expect(users.router.stack[0].name).toEqual('authenticateJwt');
  });

  describe('GET /users', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should GET an array of all documents', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser()
        ]);
      };

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, _res, () => { });

      tick(() => {
        expect(Array.isArray(_res.json.output.users)).toEqual(true);
        done();
      });
    });

    it('should populate different fields if not the current user', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser()
        ]);
      };

      const { getUsers } = mock.reRequire('./get');

      _req.params.userId = 'diffuserid';

      getUsers(_req, _req, () => {});

      tick(() => {
        expect(MockUser.selectedFields)
          .toEqual('firstName lastName emailAddressVerified');
        done();
      });
    });

    it('should populate different fields if current user', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser()
        ]);
      };

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, _req, () => {});

      tick(() => {
        expect(MockUser.selectedFields)
          .toEqual(
            'facebookId firstName lastName emailAddress emailAddressVerified'
          );
        done();
      });
    });

    it('should handle errors', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, _req, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should GET a single document', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser({
            firstName: 'John'
          })
        ]);
      };

      const { getUser } = mock.reRequire('./get');

      getUser(_req, _res, () => { });

      tick(() => {
        expect(_res.json.output.user.firstName).toEqual('John');
        done();
      });
    });

    it('should GET a single document with certain fields', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser()
        ]);
      };

      const { getUser } = mock.reRequire('./get');

      _req.params.userId = 'diffuserid';

      getUser(_req, _res, () => {});

      tick(() => {
        expect(MockUser.selectedFields)
          .toEqual('firstName lastName emailAddressVerified');
        done();
      });
    });

    it('should return different fields if the user owns the resource', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([
          new MockUser()
        ]);
      };

      const { getUser } = mock.reRequire('./get');

      getUser(_req, _res, () => {});

      tick(() => {
        expect(MockUser.selectedFields)
          .toEqual('facebookId firstName lastName emailAddress emailAddressVerified');
        done();
      });
    });

    it('should return a status 400 if the user cannot be found', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.resolve([]);
      };

      const { getUser } = mock.reRequire('./get');

      getUser(_req, {}, (err) => {
        expect(err.name).toEqual('UserNotFoundError');
        done();
      });
    });

    it('should handle a mongoose error with GET /users/:id', (done) => {
      MockUser.overrides.find.returnWith = () => {
        return Promise.reject(new Error('Some error'));
      };

      const { getUser } = mock.reRequire('./get');

      getUser(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('DELETE /users/:userId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should DELETE a document', (done) => {
      const { deleteUser } = mock.reRequire('./delete');

      deleteUser(_req, _res, () => {});

      tick(() => {
        expect(_res.json.output.message)
          .toEqual('Your account was successfully deleted. Goodbye!');
        done();
      });
    });

    it('should handle mongoose errors', (done) => {
      spyOn(MockUser, 'remove').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { deleteUser } = mock.reRequire('./delete');

      deleteUser(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('PATCH /users/:user', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should update a document', (done) => {
      const user = new MockUser();

      const spy = spyOn(user, 'updateSync');
      const { updateUser } = mock.reRequire('./patch');

      _req.body = { firstName: 'NewName' };

      spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(user)
      );

      updateUser(_req, {}, () => {
        expect(spy).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should not update using form data if fb access token is set',
      (done) => {
        const user = new MockUser();
        const spy = spyOn(user, 'updateSync');

        spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
          Promise.resolve(user)
        );

        const { updateUser } = mock.reRequire('./patch');

        _req.body = {
          facebookUserAccessToken: 'fbtoken',
          firstName: 'NewName'
        };

        updateUser(_req, _res, () => { });

        tick(() => {
          expect(spy).not.toHaveBeenCalled();
          done();
        });
      });

    it('should update a user if facebook access token is set', (done) => {
      const user = new MockUser();

      spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(user)
      );

      mock('../../lib/facebook', {
        verifyUserAccessToken: () => Promise.resolve(user),
        getProfile: () => Promise.resolve({
          first_name: 'Foo',
          last_name: 'Bar',
          email: 'foo@bar.com',
          id: '0'
        })
      });

      const { updateUser } = mock.reRequire('./patch');

      _req.body = {
        facebookUserAccessToken: 'abc123'
      };

      updateUser(_req, _res, () => { });

      tick(() => {
        expect(user.firstName).toEqual('Foo');
        expect(user.lastName).toEqual('Bar');
        expect(user.emailAddress).toEqual('foo@bar.com');
        expect(user.facebookId).toEqual('0');
        expect(user.emailAddressVerified).toEqual(true);
        done();
      });
    });

    it('should issue new email verification token if the email address changes',
      (done) => {
        const user = new MockUser({
          emailAddress: 'my@email.com'
        });

        const { updateUser } = mock.reRequire('./patch');

        spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
          Promise.resolve(user)
        );

        _req.body = {
          emailAddress: 'new@email.com'
        };

        const spy = spyOn(user, 'resetEmailAddressVerification');

        updateUser(_req, _res, () => {});

        tick(() => {
          expect(spy).toHaveBeenCalledWith();
          done();
        });
      }
    );

    it('should handle errors', (done) => {
      const { updateUser } = mock.reRequire('./patch');

      spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      updateUser(_req, _res, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle schema validation errors', (done) => {
      const user = new MockUser();
      const error = new Error();
      error.name = 'ValidationError';

      spyOn(MockUser, 'confirmUserOwnership').and.returnValue(
        Promise.resolve(user)
      );

      spyOn(user, 'updateSync').and.returnValue(
        Promise.resolve(user)
      );

      spyOn(user, 'save').and.returnValue(
        Promise.reject(error)
      );

      const { updateUser } = mock.reRequire('./patch');

      updateUser(_req, _res, (err) => {
        expect(err.name).toEqual('UserValidationError');
        done();
      });
    });
  });
});

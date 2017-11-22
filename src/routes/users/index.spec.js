const mock = require('mock-require');

describe('Users router', () => {
  let _req;

  const beforeEachCallback = () => {
    _req = {
      user: {
        _id: {
          equals: () => {
            return false;
          }
        },
        set(key, value) {
          this[key] = value;
        },
        save() {
          return Promise.resolve();
        },
        updateSync() {},
        resetEmailAddressVerification() {}
      },
      params: {
        userId: 0
      },
      body: {}
    };

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
      const User = {
        find: () => {
          return {
            select: () => {
              return {
                lean: () => Promise.resolve([])
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, {
        json: (docs) => {
          expect(Array.isArray(docs.users)).toEqual(true);
          done();
        }
      }, () => { });
    });

    it('should GET an array of all documents with certain fields', (done) => {
      let _fields;
      const User = {
        find: () => {
          return {
            select: (fields) => {
              _fields = fields;
              return {
                lean: () => Promise.resolve([])
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, {
        json: (docs) => {
          expect(_fields).toEqual('firstName lastName emailAddressVerified');
          done();
        }
      }, () => {});
    });

    it('should handle a mongoose error with GET /users', (done) => {
      const User = {
        find: () => {
          return {
            select: () => {
              return {
                lean: () => {
                  return Promise.reject(new Error('Some error'));
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUsers } = mock.reRequire('./get');

      getUsers(_req, {}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should GET a single document', (done) => {
      const User = {
        find: () => {
          return {
            limit: () => {
              return {
                select: () => {
                  return {
                    lean: () => Promise.resolve([{}])
                  };
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUser } = mock.reRequire('./get');

      getUser(_req, {
        json: (doc) => {
          expect(doc.user).toBeDefined();
          done();
        }
      }, () => {});
    });

    it('should GET a single document with certain fields', (done) => {
      let _fields;
      const User = {
        find: () => {
          return {
            limit: () => {
              return {
                select: (fields) => {
                  _fields = fields;
                  return {
                    lean: () => Promise.resolve([{}])
                  };
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUser } = mock.reRequire('./get');

      getUser(_req, {
        json: (doc) => {
          expect(_fields).toEqual('firstName lastName emailAddressVerified');
          done();
        }
      }, () => {});
    });

    it('should return different fields if the user owns the resource', (done) => {
      let _fields;
      const User = {
        find: () => {
          return {
            limit: () => {
              return {
                select: (fields) => {
                  _fields = fields;
                  return {
                    lean: () => Promise.resolve([{}])
                  };
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUser } = mock.reRequire('./get');

      _req.user._id.equals = () => true;
      getUser(_req, {
        json: (doc) => {
          expect(_fields)
            .toEqual(
              'facebookId firstName lastName emailAddress emailAddressVerified'
            );
          done();
        }
      }, () => {});
    });

    it('should return a status 400 if the user cannot be found', (done) => {
      const User = {
        find: () => {
          return {
            limit: () => {
              return {
                select: () => {
                  return {
                    lean: () => Promise.resolve([])
                  };
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUser } = mock.reRequire('./get');

      getUser(_req, {}, (err) => {
        expect(err.name).toEqual('UserNotFoundError');
        expect(err.code).toEqual(200);
        expect(err.status).toEqual(400);
        done();
      });
    });

    it('should handle a mongoose error with GET /users/:id', (done) => {
      const User = {
        find: () => {
          return {
            limit: () => {
              return {
                select: () => {
                  return {
                    lean: () => {
                      return Promise.reject(new Error('Some error'));
                    }
                  };
                }
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User });

      const { getUser } = mock.reRequire('./get');

      getUser(_req, {}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('DELETE /users/:userId', () => {
    beforeEach(beforeEachCallback);

    afterEach(afterEachCallback);

    it('should DELETE a document', (done) => {
      const User = {
        remove: () => Promise.resolve(),
        confirmUserOwnership: () => {
          return Promise.resolve({});
        }
      };

      mock('../../database/models/user', { User });

      const { deleteUser } = mock.reRequire('./delete');

      const res = {
        json: (result) => {
          expect(result.message).toEqual('Your account was successfully deleted. Goodbye!');
          done();
        }
      };

      deleteUser(_req, res, () => {});
    });

    it('should handle a mongoose error with DELETE /users/:id', (done) => {
      const User = {
        confirmUserOwnership: () => {
          return Promise.resolve({});
        },
        remove: () => {
          return Promise.reject(new Error('Some error'));
        }
      };

      mock('../../database/models/user', { User });

      const { deleteUser } = mock.reRequire('./delete');

      deleteUser(_req, {}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });

  describe('PATCH /users/:user', () => {
    let _user;
    let MockUser;

    beforeEach(() => {
      beforeEachCallback();

      _user = {
        save() {},
        updateSync() {
          return _user;
        },
        resetEmailAddressVerification() {}
      };

      MockUser = {
        confirmUserOwnership: () => {
          return Promise.resolve(_user);
        },
        find: () => {
          return {
            select: () => {
              return {
                lean: () => Promise.resolve([])
              };
            }
          };
        }
      };

      mock('../../database/models/user', { User: MockUser });
    });

    afterEach(afterEachCallback);

    it('should PATCH a document', (done) => {
      const { updateUser } = mock.reRequire('./patch');

      _req.body = { firstName: 'NewName' };

      const spy = spyOn(_user, 'updateSync');

      updateUser(_req, {}, () => {
        expect(spy).toHaveBeenCalledWith(_req.body);
        done();
      });
    });

    it('should skip PATCH of form data if fb access token is set', (done) => {
      const { updateUser } = mock.reRequire('./patch');

      _req.body = {
        facebookUserAccessToken: 'fbtoken',
        firstName: 'NewName'
      };

      const spy = spyOn(_user, 'updateSync');

      updateUser(_req, {}, () => {
        expect(spy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should PATCH a user if facebook access token is set', (done) => {
      mock('../../lib/facebook', {
        verifyUserAccessToken: () => Promise.resolve(),
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

      updateUser(_req, {}, () => {
        expect(_user.firstName).toEqual('Foo');
        expect(_user.lastName).toEqual('Bar');
        expect(_user.emailAddress).toEqual('foo@bar.com');
        expect(_user.facebookId).toEqual('0');
        expect(_user.emailAddressVerified).toEqual(true);
        done();
      });
    });

    it('should skip PATCH if facebook access token is not set', (done) => {
      const facebook = mock.reRequire('../../lib/facebook');

      spyOn(facebook, 'verifyUserAccessToken').and.returnValue(Promise.resolve());

      const { updateUser } = mock.reRequire('./patch');

      _req.body = {};

      updateUser(_req, {}, () => {
        expect(facebook.verifyUserAccessToken).not.toHaveBeenCalled();
        done();
      });
    });

    it('should issue a new email verification token if the email address changes',
      (done) => {
        const { updateUser } = mock.reRequire('./patch');

        _user.emailAddress = 'my@email.com';
        _req.body = { emailAddress: 'new@email.com' };

        const spy = spyOn(_user, 'resetEmailAddressVerification');

        updateUser(_req, {}, () => {
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

      updateUser(_req, {}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });

    it('should handle schema validation error with PATCH /users/:id', (done) => {
      const { updateUser } = mock.reRequire('./patch');

      _user.save = () => {
        const error = new Error();
        error.name = 'ValidationError';
        return Promise.reject(error);
      };

      mock('../../lib/facebook', {
        verifyUserAccessToken: () => Promise.resolve(_user),
        getProfile: () => Promise.resolve()
      });

      updateUser(_req, {}, (err) => {
        expect(err.name).toEqual('UserValidationError');
        done();
      });
    });
  });
});

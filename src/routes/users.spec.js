const mock = require('mock-require');

describe('/users', () => {
  let passport;
  let _req;

  beforeEach(() => {
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
        }
      },
      params: {
        id: 0
      },
      body: {}
    };
    passport = mock.reRequire('passport');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    spyOn(passport, 'authenticate').and.callThrough();
    const users = mock.reRequire('./users');
    expect(users.router.stack[0].name).toEqual('authenticate');
    expect(passport.authenticate).toHaveBeenCalledWith('jwt', { session: false });
  });

  it('should GET an array of all documents', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          select: () => {
            return {
              lean: () => Promise.resolve([])
            };
          }
        };
      }
    });
    const users = mock.reRequire('./users');
    const getUsers = users.middleware.getUsers;
    getUsers[0](_req, {
      json: (docs) => {
        expect(Array.isArray(docs)).toEqual(true);
        done();
      }
    }, () => {});
  });

  it('should GET an array of all documents with certain fields', (done) => {
    let _fields;
    mock('../database/models/user', {
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
    });
    const users = mock.reRequire('./users');
    const getUsers = users.middleware.getUsers;
    getUsers[0](_req, {
      json: (docs) => {
        expect(_fields).toEqual('firstName lastName emailAddressVerified');
        done();
      }
    }, () => {});
  });

  it('should handle a mongoose error with GET /users', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          select: () => {
            return {
              lean: () => Promise.reject(new Error())
            };
          }
        };
      }
    });
    const users = mock.reRequire('./users');
    const getUsers = users.middleware.getUsers;
    getUsers[0](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should GET a single document', (done) => {
    mock('../database/models/user', {
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
    });
    const users = mock.reRequire('./users');
    const getUser = users.middleware.getUser;
    getUser[0](_req, {
      json: (doc) => {
        expect(doc).toBeDefined();
        done();
      }
    }, () => {});
  });

  it('should GET a single document with certain fields', (done) => {
    let _fields;
    mock('../database/models/user', {
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
    });
    const users = mock.reRequire('./users');
    const getUser = users.middleware.getUser;
    getUser[0](_req, {
      json: (doc) => {
        expect(_fields).toEqual('firstName lastName emailAddressVerified');
        done();
      }
    }, () => {});
  });

  it('should return different fields if the user owns the resource', (done) => {
    let _fields;
    mock('../database/models/user', {
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
    });
    const users = mock.reRequire('./users');
    const getUser = users.middleware.getUser;
    _req.user._id.equals = () => true;
    getUser[0](_req, {
      json: (doc) => {
        expect(_fields).toEqual('firstName lastName emailAddress emailAddressVerified');
        done();
      }
    }, () => {});
  });

  it('should return a status 400 if the user cannot be found', (done) => {
    mock('../database/models/user', {
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
    });
    const users = mock.reRequire('./users');
    const getUser = users.middleware.getUser;
    getUser[0](_req, {}, (err) => {
      expect(err.code).toEqual(200);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('should handle a mongoose error with GET /users/:id', (done) => {
    mock('../database/models/user', {
      find: () => {
        return {
          limit: () => {
            return {
              select: () => {
                return {
                  lean: () => Promise.reject(new Error())
                };
              }
            };
          }
        };
      }
    });
    const users = mock.reRequire('./users');
    const getUser = users.middleware.getUser;
    getUser[0](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should PATCH a document', (done) => {
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    _req.body = { firstName: 'NewName' };
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        expect(_req.user.firstName).toEqual('NewName');
        done();
      }
    };
    updateUser[1](_req, res, () => {});
  });

  it('should only PATCH certain fields', (done) => {
    spyOn(_req.user, 'set').and.callThrough();
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    _req.body = { invalidField: 'foobar' };
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        expect(_req.user.set).not.toHaveBeenCalled();
        done();
      }
    };
    updateUser[1](_req, res, () => {});
  });

  it('should only PATCH a document if it is owned by the session user', () => {
    const users = mock.reRequire('./users');
    expect(users.middleware.updateUser[0].name).toEqual('confirmUserOwnership');
  });

  it('should issue a new email verification token if the email address changes', (done) => {
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    _req.user.emailAddress = 'my@email.com';
    _req.user.resetEmailAddressVerification = () => {};
    _req.body = { emailAddress: 'new@email.com' };
    const res = {
      json: (result) => {
        expect(_req.user.emailAddress).toEqual('new@email.com');
        expect(_req.user.resetEmailAddressVerification).toHaveBeenCalled();
        done();
      }
    };
    spyOn(_req.user, 'resetEmailAddressVerification').and.callThrough();
    updateUser[1](_req, res, () => {});
  });

  it('should handle a mongoose error with PATCH /users/:id', (done) => {
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    updateUser[1](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should handle a schema validation error with PATCH /users/:id', (done) => {
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;

    _req.user.save = () => {
      const error = new Error();
      error.name = 'ValidationError';
      return Promise.reject(error);
    };

    updateUser[1](_req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(201);
      done();
    });
  });

  it('should DELETE a document', (done) => {
    mock('../database/models/user', {
      remove: () => Promise.resolve()
    });
    const users = mock.reRequire('./users');
    const deleteUser = users.middleware.deleteUser;
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        done();
      }
    };
    deleteUser[1](_req, res, () => {});
  });

  it('should only DELETE a document if it is owned by the session user', () => {
    const users = mock.reRequire('./users');
    expect(users.middleware.deleteUser[0].name).toEqual('confirmUserOwnership');
  });

  it('should handle a mongoose error with DELETE /users/:id', (done) => {
    mock('../database/models/user', {
      remove: () => Promise.reject(new Error())
    });
    const users = mock.reRequire('./users');
    const deleteUser = users.middleware.deleteUser;
    deleteUser[1](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

const mock = require('mock-require');

describe('/users', () => {
  let passport;

  beforeEach(() => {
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
    getUsers[0]({}, {
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
    getUsers[0]({}, {
      json: (docs) => {
        expect(_fields).toEqual('firstName lastName');
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
    getUsers[0]({}, {}, (err) => {
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
    const req = {
      params: { id: 0 }
    };
    getUser[0](req, {
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
    const req = {
      params: { id: 0 }
    };
    getUser[0](req, {
      json: (doc) => {
        expect(_fields).toEqual('firstName lastName');
        done();
      }
    }, () => {});
  });

  it('should pass a 404 if the user cannot be found', (done) => {
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
    const req = {
      params: { id: 0 }
    };
    getUser[0](req, {}, (err) => {
      expect(err.status).toEqual(404);
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
    const req = {
      params: { id: 0 }
    };
    getUser[0](req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should PATCH a document', (done) => {
    mock('../database/models/user', {
      update: (query, changes) => {
        expect(changes.firstName).toEqual('NewName');
        return Promise.resolve();
      }
    });
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    const req = {
      params: { id: 0 },
      body: {
        firstName: 'NewName'
      }
    };
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        done();
      }
    };
    updateUser[1](req, res, () => {});
  });

  it('should only PATCH certain fields', (done) => {
    mock('../database/models/user', {
      update: (query, changes) => {
        expect(changes.invalidField).toBeUndefined();
        return Promise.resolve();
      }
    });
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    const req = {
      params: { id: 0 },
      body: {
        invalidField: 'foobar'
      }
    };
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        done();
      }
    };
    updateUser[1](req, res, () => {});
  });

  it('should only PATCH a document if it is owned by the session user', () => {
    const users = mock.reRequire('./users');
    expect(users.middleware.updateUser[0].name).toEqual('confirmUserOwnership');
  });

  it('should handle a mongoose error with PATCH /users/:id', (done) => {
    mock('../database/models/user', {
      update: () => Promise.reject(new Error())
    });
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    const req = {
      params: { id: 0 },
      body: {}
    };
    updateUser[1](req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should handle a schema validation error with PATCH /users/:id', (done) => {
    mock('../database/models/user', {
      update: () => {
        const error = new Error();
        error.name = 'ValidationError';
        return Promise.reject(error);
      }
    });
    const users = mock.reRequire('./users');
    const updateUser = users.middleware.updateUser;
    const req = {
      params: { id: 0 },
      body: {}
    };
    updateUser[1](req, {}, (err) => {
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
    const req = {
      params: { id: 0 }
    };
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        done();
      }
    };
    deleteUser[1](req, res, () => {});
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
    const req = {
      params: { id: 0 }
    };
    deleteUser[1](req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

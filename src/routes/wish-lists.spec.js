const mock = require('mock-require');

describe('/wish-lists', () => {
  let _req;

  beforeEach(() => {
    _req = {
      user: {},
      params: {
        wishListId: 0
      },
      body: {}
    };
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should require a jwt for all routes', () => {
    const wishLists = mock.reRequire('./wish-lists');
    expect(wishLists.router.stack[0].name).toEqual('authenticateJwt');
  });

  it('should GET an array of all documents', (done) => {
    mock('../database/models/wish-list', {
      find: () => {
        return {
          populate: () => {
            return {
              lean: () => Promise.resolve([])
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishLists = wishLists.middleware.getWishLists;
    getWishLists[0](_req, {
      json: (docs) => {
        expect(Array.isArray(docs)).toEqual(true);
        done();
      }
    }, () => {});
  });

  it('should only populate certain fields with GET /wish-lists/', (done) => {
    let _fields;
    mock('../database/models/wish-list', {
      find: () => {
        return {
          populate: (source, fields) => {
            _fields = fields;
            return {
              lean: () => Promise.resolve([])
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishLists = wishLists.middleware.getWishLists;
    getWishLists[0](_req, {
      json: (docs) => {
        expect(Array.isArray(docs)).toEqual(true);
        expect(_fields).toEqual('firstName lastName');
        done();
      }
    }, () => {});
  });

  it('should handle a mongoose error with GET /wish-lists', (done) => {
    mock('../database/models/wish-list', {
      find: () => {
        return {
          populate: () => {
            return {
              lean: () => Promise.reject(new Error())
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishLists = wishLists.middleware.getWishLists;
    getWishLists[0](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should GET a single document', (done) => {
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => {
            return {
              populate: () => {
                return {
                  lean: () => Promise.resolve([{}])
                };
              }
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishList = wishLists.middleware.getWishList;
    getWishList[0](_req, {
      json: (doc) => {
        expect(doc).toBeDefined();
        done();
      }
    }, () => {});
  });

  it('should only populate certain fields with GET /wish-lists/:wishListId', (done) => {
    let _fields;
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => {
            return {
              populate: (source, fields) => {
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
    const wishLists = mock.reRequire('./wish-lists');
    const getWishList = wishLists.middleware.getWishList;
    getWishList[0](_req, {
      json: (doc) => {
        expect(doc).toBeDefined();
        expect(_fields).toEqual('firstName lastName');
        done();
      }
    }, () => {});
  });

  it('should return a status 400 if the wish list cannot be found', (done) => {
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => {
            return {
              populate: () => {
                return {
                  lean: () => Promise.resolve([])
                };
              }
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishList = wishLists.middleware.getWishList;
    getWishList[0](_req, {}, (err) => {
      expect(err.code).toEqual(300);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('should handle a mongoose error with GET /wish-lists/:wishListId', (done) => {
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => {
            return {
              populate: () => {
                return {
                  lean: () => Promise.reject(new Error())
                };
              }
            };
          }
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const getWishList = wishLists.middleware.getWishList;
    getWishList[0](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should PATCH a document', (done) => {
    const _wishList = {
      save: () => Promise.resolve(),
      set(key, value) {
        this[key] = value;
      }
    };
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => Promise.resolve([_wishList])
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const updateWishList = wishLists.middleware.updateWishList;
    _req.body = { name: 'NewName' };
    updateWishList[1](_req, {
      json: () => {
        expect(_wishList.name).toEqual('NewName');
        done();
      }
    }, () => {});
  });

  it('should only PATCH certain fields', (done) => {
    const _wishList = {
      save: () => Promise.resolve(),
      set(key, value) {
        this[key] = value;
      }
    };
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => Promise.resolve([_wishList])
        };
      }
    });
    spyOn(_wishList, 'set');
    const wishLists = mock.reRequire('./wish-lists');
    const updateWishList = wishLists.middleware.updateWishList;
    _req.body = { invalidField: 'foobar' };
    updateWishList[1](_req, {
      json: () => {
        expect(_wishList.invalidField).toBeUndefined();
        expect(_wishList.set).not.toHaveBeenCalled();
        done();
      }
    }, () => {});
  });

  it('should clear a field during PATCH if set to null', (done) => {
    const _wishList = {
      save: () => Promise.resolve(),
      set(key, value) {
        this[key] = value;
      }
    };
    spyOn(_wishList, 'set').and.callThrough();
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => Promise.resolve([_wishList])
        };
      }
    });
    const wishLists = mock.reRequire('./wish-lists');
    const updateWishList = wishLists.middleware.updateWishList;
    _req.body = { name: null };
    updateWishList[1](_req, {
      json: () => {
        expect(_wishList.set).toHaveBeenCalledWith('name', undefined);
        expect(_wishList.name).toBeUndefined();
        done();
      }
    }, (err) => { console.log(err); });
  });

  it('should only PATCH a document if it is owned by the session user', () => {
    const wishLists = mock.reRequire('./wish-lists');
    expect(wishLists.middleware.updateWishList[0].name).toEqual('confirmUserOwnership');
  });

  it('should handle a schema validation error with PATCH /wish-lists/:wishListId', (done) => {
    const _wishList = {
      save: () => {
        const error = new Error();
        error.name = 'ValidationError';
        return Promise.reject(error);
      },
      set(key, value) {
        this[key] = value;
      }
    };
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => Promise.resolve([_wishList])
        };
      }
    });
    spyOn(_wishList, 'set');
    const wishLists = mock.reRequire('./wish-lists');
    const updateWishList = wishLists.middleware.updateWishList;
    _req.body = { invalidField: 'foobar' };
    updateWishList[1](_req, {}, (err) => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(301);
      expect(err.status).toEqual(400);
      done();
    });
  });

  it('should handle other errors with PATCH /wish-lists/:wishListId', (done) => {
    const _wishList = {
      save: () => Promise.reject(new Error()),
      set(key, value) {
        this[key] = value;
      }
    };
    mock('../database/models/wish-list', {
      find: () => {
        return {
          limit: () => Promise.resolve([_wishList])
        };
      }
    });
    spyOn(_wishList, 'set');
    const wishLists = mock.reRequire('./wish-lists');
    const updateWishList = wishLists.middleware.updateWishList;
    _req.body = { invalidField: 'foobar' };
    updateWishList[1](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should DELETE a document', (done) => {
    mock('../database/models/wish-list', {
      remove: () => Promise.resolve()
    });
    const wishLists = mock.reRequire('./wish-lists');
    const deleteWishList = wishLists.middleware.deleteWishList;
    const res = {
      json: (result) => {
        expect(result.message).toBeDefined();
        done();
      }
    };
    deleteWishList[1](_req, res, () => {});
  });

  it('should only DELETE a document if it is owned by the session user', () => {
    const wishLists = mock.reRequire('./wish-lists');
    expect(wishLists.middleware.deleteWishList[0].name).toEqual('confirmUserOwnership');
  });

  it('should create new wish lists', (done) => {
    let _options;

    class MockWishList {
      constructor(options) {
        _options = options;
      }

      save() {
        return Promise.resolve({ _id: 1 });
      }
    }

    mock('../database/models/wish-list', MockWishList);

    const wishLists = mock.reRequire('./wish-lists');
    const createWishList = wishLists.middleware.createWishList;

    _req.user._id = 0;
    _req.body.name = 'New name';

    createWishList[0](_req, {
      json: (result) => {
        expect(result.id).toEqual(1);
        expect(result.message).toBeDefined();
        expect(_options._user).toBeDefined();
        expect(_options.name).toBeDefined();
        done();
      }
    }, () => {});
  });

  it('should handle schema validation errors when creating new wish lists', (done) => {
    class MockWishList {
      save() {
        return Promise.reject(new Error());
      }
    }

    mock('../database/models/wish-list', MockWishList);

    const wishLists = mock.reRequire('./wish-lists');
    const createWishList = wishLists.middleware.createWishList;

    createWishList[0](_req, {}, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

describe('confirm user ownership middleware', () => {
  it('should pass an error to the callback if the session does not own the resource', () => {
    const middleware = require('./confirm-user-ownership');
    const req = {
      user: {
        _id: {
          equals: () => false
        }
      },
      params: {
        id: 0
      }
    };
    const next = (err) => {
      expect(err).toBeDefined();
    };
    middleware(req, null, next);
  });

  it('should pass an error to the callback if the session does not include a user', () => {
    const middleware = require('./confirm-user-ownership');
    const req = {
      params: {
        id: 0
      }
    };
    const next = (err) => {
      expect(err).toBeDefined();
    };
    middleware(req, null, next);
  });

  it('should continue if the session does own the resource', () => {
    const middleware = require('./confirm-user-ownership');
    const req = {
      user: {
        _id: {
          equals: () => true
        }
      },
      params: {
        id: 0
      }
    };
    const next = (err) => {
      expect(err).toBeUndefined();
    };
    middleware(req, null, next);
  });

  it('should continue if the req does not include an ID', () => {
    const middleware = require('./confirm-user-ownership');
    const req = {
      user: {
        _id: {
          equals: () => true
        }
      },
      params: {}
    };
    const next = (err) => {
      expect(err).toBeUndefined();
    };
    middleware(req, null, next);
  });
});

describe('confirm user ownership middleware', () => {
  it('should pass an error to the callback if the session does not own the resource', () => {
    const middleware = require('./confirm-user-owns-user');
    const req = {
      user: {
        _id: {
          equals: () => false
        }
      },
      params: {
        userId: 0
      }
    };
    const next = (err) => {
      expect(err).toBeDefined();
      expect(err.status).toEqual(403);
      expect(err.code).toEqual(103);
    };
    middleware(req, null, next);
  });

  it('should pass an error to the callback if the session does not include a user', () => {
    const middleware = require('./confirm-user-owns-user');
    const req = {
      params: {
        userId: 0
      }
    };
    const next = (err) => {
      expect(err).toBeDefined();
    };
    middleware(req, null, next);
  });

  it('should continue if the session does own the resource', () => {
    const middleware = require('./confirm-user-owns-user');
    const req = {
      user: {
        _id: {
          equals: () => true
        }
      },
      params: {
        userId: 0
      }
    };
    const next = (err) => {
      expect(err).toBeUndefined();
    };
    middleware(req, null, next);
  });

  it('should continue if the req does not include an ID', () => {
    const middleware = require('./confirm-user-owns-user');
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

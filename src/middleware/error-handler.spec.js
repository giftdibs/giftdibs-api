describe('error handler middleware', () => {
  it('should send an error as a json response', () => {
    const middleware = require('./error-handler');
    const err = new Error('invalid');
    err.status = 403;
    const res = {
      status: (code) => {
        return {
          json: (result) => {
            expect(result.message).toBe('invalid');

            expect(code).toEqual(403);
          }
        };
      }
    };
    middleware(err, null, res, () => {});
  });

  it('should default the error status to 404', () => {
    const middleware = require('./error-handler');
    const err = new Error('invalid');
    const res = {
      status: (code) => {
        return {
          json: (result) => {
            expect(code).toEqual(404);
          }
        };
      }
    };
    middleware(err, null, res, () => {});
  });
});

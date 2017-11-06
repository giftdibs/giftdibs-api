const mock = require('mock-require');

describe('Error handler middleware', () => {
  it('should send an error as a json response', () => {
    const middleware = mock.reRequire('./error-handler');
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

  it('should send multiple errors', () => {
    const middleware = mock.reRequire('./error-handler');
    const err = new Error('invalid');
    err.errors = [];
    const res = {
      status: (code) => {
        return {
          json: (result) => {
            expect(result.errors).toEqual([]);
          }
        };
      }
    };
    middleware(err, null, res, () => {});
  });

  it('should default the error status to 404', () => {
    const middleware = mock.reRequire('./error-handler');
    const err = new Error('invalid');
    const res = {
      status: (statusCode) => {
        return {
          json: (result) => {
            expect(result.code).toEqual(0);
            expect(statusCode).toEqual(404);
          }
        };
      }
    };
    middleware(err, null, res, () => {});
  });
});

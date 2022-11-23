const mock = require('mock-require');
const logger = require('winston');

describe('Error handler middleware', () => {
  beforeEach(() => {
    spyOn(logger, 'warn').and.returnValue();
  });

  it('should not pass 500 error messages to the client', () => {
    const middleware = mock.reRequire('./error-handler');
    const err = new Error('invalid');
    const res = {
      status: (code) => {
        return {
          json: (result) => {
            expect(result.message).not.toBe('invalid');
            expect(result.code).toEqual(0);
            expect(code).toEqual(500);
          },
        };
      },
    };
    middleware(err, null, res, () => {});
  });

  it('should send multiple errors', () => {
    const middleware = mock.reRequire('./error-handler');
    const err = new Error('invalid');
    err.status = 404;
    err.errors = [];
    const res = {
      status: (code) => {
        return {
          json: (result) => {
            expect(result.errors).toEqual([]);
          },
        };
      },
    };
    middleware(err, null, res, () => {});
  });
});

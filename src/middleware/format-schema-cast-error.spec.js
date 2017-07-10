describe('format schema cast error', () => {
  it('should format ObjectId cast errors', () => {
    const error = new Error();
    error.message = '';
    error.name = 'CastError';
    error.status = 500;
    const middleware = require('./format-schema-cast-error');
    middleware(error, {}, {}, (err) => {
      expect(err.status).toEqual(400);
      expect(err.message).toEqual('The ID provided is not formatted correctly.');
      expect(err.code).toEqual(1);
    });
  });

  it('should not change other errors', () => {
    const error = new Error();
    error.status = 500;
    const middleware = require('./format-schema-cast-error');
    middleware(error, {}, {}, (err) => {
      expect(err.status).toEqual(500);
    });
  });
});

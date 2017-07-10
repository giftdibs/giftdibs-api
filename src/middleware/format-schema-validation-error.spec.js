describe('format schema validation error', () => {
  it('should format schema validation errors', () => {
    const error = new Error();
    error.name = 'ValidationError';
    error.errors = {
      emailAddress: {
        message: 'Some message.',
        field: 'emailAddress'
      }
    };
    const middleware = require('./format-schema-validation-error');
    middleware(error, {}, {}, (err) => {
      expect(err.errors.emailAddress).toBeUndefined();
      expect(err.errors[0].message).toEqual('Some message.');
      expect(err.errors[0].field).toEqual('emailAddress');
    });
  });

  it('should not change other errors', () => {
    const error = new Error();
    error.status = 500;
    const middleware = require('./format-schema-validation-error');
    middleware(error, {}, {}, (err) => {
      expect(err.status).toEqual(500);
      expect(err.name).toEqual('Error');
    });
  });
});

describe('error', () => {
  it('should return error constructors', () => {
    const errors = require('./errors');

    Object.keys(errors).forEach((key) => {
      expect(typeof errors[key]).toEqual('function');

      const err = new errors[key]();
      expect(err.code).toBeDefined();
      expect(err.status).toBeDefined();
      expect(err.message).toBeDefined();
    });
  });
});

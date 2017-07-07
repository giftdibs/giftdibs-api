describe('404 middleware', () => {
  it('should pass an error to the callback', () => {
    const middleware = require('./404');
    middleware(null, null, (err) => {
      expect(err).toBeDefined();

      expect(err.status).toBe(404);
    });
  });
});

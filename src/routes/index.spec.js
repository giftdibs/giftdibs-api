describe('routes index', () => {
  it('should return an array of middleware', () => {
    const routes = require('./index');
    expect(routes.push).toBeDefined();
    expect(typeof routes[0]).toEqual('function');
  });
});

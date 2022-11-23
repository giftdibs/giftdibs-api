const mock = require('mock-require');

describe('routes index', () => {
  let routerExport;

  beforeEach(() => {
    routerExport = {
      router() {},
    };

    mock('./auth', routerExport);
    mock('./auth-facebook', routerExport);
    mock('./comments', routerExport);
    mock('./dibs', routerExport);
    mock('./friendships', routerExport);
    mock('./gifts', routerExport);
    mock('./search', routerExport);
    mock('./users', routerExport);
    mock('./wish-lists', routerExport);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should return an array of middleware', () => {
    const routes = require('./index');
    expect(routes.push).toBeDefined();
    expect(typeof routes[0]).toEqual('function');
  });
});

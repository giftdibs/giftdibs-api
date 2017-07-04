const mock = require('mock-require');

describe('app', () => {
  beforeEach(() => {
    mock('./environment', () => {});
    mock('express', () => {
      return {
        set: () => {},
        use: () => {},
        port: () => {}
      };
    });
    mock('passport', {
      use: () => {},
      initialize: () => {},
      authenticate: () => {}
    })
    mock('./strategies/jwt', {});
    mock('./strategies/local', {});
    mock('./routes', {});
    mock('./database', {
      connect: () => {}
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should export an ExpressJS app object', () => {
    const app = require('./app');
    expect(app).toBeDefined();
    expect(typeof app.port).toEqual('function');
  });
});
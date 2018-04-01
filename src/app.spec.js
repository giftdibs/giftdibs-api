const mock = require('mock-require');

describe('App', () => {
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
    });

    mock('./middleware/access-control', {});
    mock('./routes', {});
    mock('./middleware/404', {});
    mock('./middleware/error-handler', {});

    mock('./strategies/jwt', {});
    mock('./strategies/local', {});
    mock('./database', {
      connect: () => {}
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should export an ExpressJS app object', () => {
    const app = mock.reRequire('./app');
    expect(app).toBeDefined();
    expect(typeof app.port).toEqual('function');
  });

  it('should configure cors', () => {
    mock('cors', (config) => {
      expect(config.origin).toEqual('http://localhost:4200');
      expect(config.methods).toEqual('GET,POST,PATCH,DELETE,OPTIONS');
    });
    mock.reRequire('./app');
  });
});

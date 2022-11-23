const mock = require('mock-require');

describe('Facebook service', () => {
  beforeEach(() => {});

  afterEach(() => {
    mock.stopAll();
  });

  it('should should return an object', () => {
    mock('request-promise', () => {});
    const lib = mock.reRequire('./facebook');
    expect(lib.verifyUserAccessToken).toBeDefined();
    expect(lib.getProfile).toBeDefined();
  });

  it('should should make a request to fetch a facebook profile', () => {
    let _opts;
    mock('request-promise', (opts) => {
      _opts = opts;
      return Promise.resolve();
    });
    const lib = mock.reRequire('./facebook');
    const result = lib.getProfile('abc123');
    expect(typeof result.then).toEqual('function');
    expect(_opts.qs.access_token).toEqual('abc123');
    expect(_opts.qs.fields).toEqual('email,first_name,last_name');
  });

  it('should make a request to verify a facebook user access token', (done) => {
    let _opts = [];
    mock('request-promise', (opts) => {
      _opts.push(opts);
      return Promise.resolve({ access_token: 'abc123' });
    });
    const lib = mock.reRequire('./facebook');
    const result = lib.verifyUserAccessToken('myuseraccesstoken');
    expect(typeof result.then).toEqual('function');
    result
      .then(() => {
        expect(_opts[0].qs.grant_type).toEqual('client_credentials');
        expect(_opts[1].qs.input_token).toEqual('myuseraccesstoken');
        done();
      })
      .catch(done.fail);
  });
});

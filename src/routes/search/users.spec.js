const mock = require('mock-require');

const {
  tick,
  MockUser,
  MockRequest,
  MockResponse
} = require('../../shared/testing');

describe('Users router', () => {
  let _req;
  let _res;

  beforeEach(() => {
    MockUser.reset();

    _req = new MockRequest({});
    _res = new MockResponse();

    mock('../../database/models/user', { User: MockUser });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should search users first and last name', (done) => {
    _req.params.encodedSearchText = 'bob';

    MockUser.overrides.find.returnWith = () => {
      return Promise.resolve([
        new MockUser()
      ]);
    };

    const { searchUsers } = mock.reRequire('./users');

    searchUsers(_req, _res, () => { });

    tick(() => {
      expect(MockUser.selectedFields).toEqual('firstName lastName _id');
      expect(MockUser.limit).toEqual(15);
      expect(Array.isArray(_res.json.output.data.results)).toEqual(true);
      done();
    });
  });

  it('should handle errors', (done) => {
    _req.params.encodedSearchText = 'bob';

    MockUser.overrides.find.returnWith = () => {
      return Promise.reject(new Error('some error'));
    };

    const { searchUsers } = mock.reRequire('./users');

    searchUsers(_req, _res, (err) => {
      expect(err.message).toEqual('some error');
      done();
    });
  });
});

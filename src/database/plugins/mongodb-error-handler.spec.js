const mock = require('mock-require');

describe('MongoDbErrorHandlerPlugin', () => {
  it('should convert mongodb errors to mongoose validation errors', () => {
    const plugin = mock.reRequire('./mongodb-error-handler');
    let error = new Error(
      'E11000 duplicate key error collection: api.User index: emailAddress_1 dup key: { : "foo@bar.com" } emailAddress_1 dup key: { : "foo@bar.com" }'
    );
    error.name = 'MongoError';
    error.code = 11000;
    plugin.errorHandler(error, {}, (err) => {
      expect(err.errors.emailAddress.kind).toEqual('unique');
    });
  });

  it('should pass the original error to the callback if type errors are encountered', () => {
    const plugin = mock.reRequire('./mongodb-error-handler');
    let error = new Error();
    error.name = 'MongoError';
    error.code = 11000;
    plugin.errorHandler(error, {}, (err) => {
      expect(err.name).toEqual('MongoError');
    });
  });

  it('should cover all update hooks', () => {
    let hooks = [];
    const plugin = mock.reRequire('./mongodb-error-handler');
    const mockSchema = {
      post: (hook) => {
        hooks.push(hook);
      }
    };
    const contains = (arr, str) => {
      return (arr.indexOf(str) > -1);
    };
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    expect(contains(hooks, 'save')).toEqual(true);
    expect(contains(hooks, 'update')).toEqual(true);
    expect(contains(hooks, 'findOneAndUpdate')).toEqual(true);
    expect(contains(hooks, 'insertMany')).toEqual(true);
    expect(contains(hooks, 'validate')).toEqual(true);
  });

  it('should not change other errors', () => {
    const plugin = mock.reRequire('./mongodb-error-handler');
    let error = new Error();
    error.status = 500;
    plugin.errorHandler(error, {}, (err) => {
      expect(err.status).toBe(500);
    });
  });
});

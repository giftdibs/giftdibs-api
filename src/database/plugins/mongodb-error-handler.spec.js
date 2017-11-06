const mock = require('mock-require');

describe('MongoDbErrorHandlerPlugin', () => {
  let mockSchema;
  let mongoError;
  let plugin;

  beforeEach(() => {
    plugin = mock.reRequire('./mongodb-error-handler');

    mongoError = new Error();
    mongoError.message = [
      'E11000 duplicate key error collection:',
      'api.User index: emailAddress_1 dup key: { : "foo@bar.com" }',
      'emailAddress_1 dup key: { : "foo@bar.com" }'
    ].join(' ');
    mongoError.name = 'MongoError';
    mongoError.code = 11000;

    mockSchema = {
      paths: {
        emailAddress: {
          options: {
            unique: [true, 'Some error message.']
          }
        }
      }
    };
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should convert mongodb errors to mongoose validation errors', () => {
    let _callback;
    mockSchema.post = (hook, cb) => {
      _callback = cb;
    };
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    _callback.call({ schema: mockSchema }, mongoError, {}, (err) => {
      expect(err.errors.emailAddress.kind).toEqual('unique');
    });
  });

  it([
    'should pass the original error to the callback',
    'if type errors are encountered'
  ].join(' '), () => {
    mongoError.message = '';
    let _callback;
    mockSchema.post = (hook, cb) => {
      _callback = cb;
    };
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    _callback.call({ schema: mockSchema }, mongoError, {}, (err) => {
      expect(err.name).toEqual('MongoError');
    });
  });

  it('should cover all update hooks', () => {
    let hooks = [];
    mockSchema.post = (hook) => hooks.push(hook);
    const contains = (arr, str) => arr.indexOf(str) > -1;
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    expect(contains(hooks, 'save')).toEqual(true);
    expect(contains(hooks, 'update')).toEqual(true);
    expect(contains(hooks, 'findOneAndUpdate')).toEqual(true);
    expect(contains(hooks, 'insertMany')).toEqual(true);
    expect(contains(hooks, 'validate')).toEqual(true);
  });

  it('should not change other errors', () => {
    let error = new Error();
    error.status = 500;
    let _callback;
    mockSchema.post = (hook, cb) => {
      _callback = cb;
    };
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    _callback.call({ schema: mockSchema }, error, {}, (err) => {
      expect(err.name).toEqual('Error');
      expect(err.status).toBe(500);
    });
  });

  it('should use a default message if none provided on the schema', () => {
    let _callback;
    mockSchema.paths.emailAddress.options.unique = true;
    mockSchema.post = (hook, cb) => {
      _callback = cb;
    };
    plugin.MongoDbErrorHandlerPlugin(mockSchema);
    _callback.call({ schema: mockSchema }, mongoError, {}, (err) => {
      const isDefaultMessage = (
        err.errors.emailAddress.message.indexOf('is expected to be unique') > -1
      );
      expect(isDefaultMessage).toEqual(true);
    });
  });
});

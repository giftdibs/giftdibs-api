const mock = require('mock-require');

describe('ConfirmUserOwnershipPlugin', () => {
  let MockSchema;
  let MockPermissionError;
  let MockNotFoundError;
  let MockValidationError;
  let _docUserId;
  let _context;

  beforeEach(() => {
    _docUserId = 'userid';
    _context = {
      find() {
        return {
          limit: () => {
            return Promise.resolve([
              new MockSchema()
            ])
          }
        };
      }
    };

    MockPermissionError = function () {};
    MockNotFoundError = function () {};
    MockValidationError = function () {};

    MockSchema = function () {
      this._user = _docUserId;
    };

    MockSchema.statics = {};
  });

  afterEach(() => {
  });

  it('should add a static method to the schema', () => {
    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');
    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {});

    expect(plugin).toBeDefined();
    expect(typeof MockSchema.statics.confirmUserOwnership).toEqual('function');
  });

  it('should fail if the session does not own the resource', (done) => {
    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');

    _docUserId = 'diffuserid';

    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {
      errors: {
        permission: new MockPermissionError()
      }
    });

    MockSchema.statics
      .confirmUserOwnership.apply(_context, ['docid', 'userid'])
      .catch((err) => {
        expect(plugin).toBeDefined();
        expect(err instanceof MockPermissionError).toEqual(true);
        done();
      });
  });

  it('should continue if the session does own the resource', (done) => {
    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');
    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {});

    MockSchema.statics.confirmUserOwnership
      .apply(_context, ['docid', 'userid'])
      .then((doc) => {
        expect(plugin).toBeDefined();
        expect(doc._user).toEqual('userid');
        done();
      })
      .catch(done.fail);
  });

  it('should allow different field names for the user ID', (done) => {
    MockSchema = function () {
      this._somefield = 'userid';
    };
    MockSchema.statics = {};

    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');
    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {
      userIdField: '_somefield'
    });

    MockSchema.statics.confirmUserOwnership
      .apply(_context, ['docid', 'userid'])
      .then((doc) => {
        expect(plugin).toBeDefined();
        expect(doc._somefield).toEqual('userid');
        done();
      })
      .catch(done.fail);
  });

  it('should handle errors', (done) => {
    spyOn(_context, 'find').and.returnValue({
      limit: () => {
        return Promise.reject(
          new Error('Some error')
        )
      }
    });

    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');

    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, { });

    MockSchema.statics
      .confirmUserOwnership.apply(_context, ['docid', 'userid'])
      .catch((err) => {
        expect(plugin).toBeDefined();
        expect(err.message).toEqual('Some error');
        done();
      });
  });

  it('should handle resource not found error', (done) => {
    spyOn(_context, 'find').and.returnValue({
      limit: () => {
        return Promise.resolve([])
      }
    });

    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');

    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {
      errors: {
        notFound: new MockNotFoundError()
      }
    });

    MockSchema.statics
      .confirmUserOwnership.apply(_context, ['docid', 'userid'])
      .catch((err) => {
        expect(plugin).toBeDefined();
        expect(err instanceof MockNotFoundError).toEqual(true);
        done();
      });
  });

  it('should handle resource id validation', (done) => {
    const { ConfirmUserOwnershipPlugin } = mock.reRequire('./confirm-user-ownership');

    const plugin = new ConfirmUserOwnershipPlugin(MockSchema, {
      errors: {
        validation: new MockValidationError()
      }
    });

    MockSchema.statics
      .confirmUserOwnership.apply(_context, [undefined, 'userid'])
      .catch((err) => {
        expect(plugin).toBeDefined();
        expect(err instanceof MockValidationError).toEqual(true);
        done();
      });
  });
});

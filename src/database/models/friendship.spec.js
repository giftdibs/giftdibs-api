const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Friendship schema', () => {
  let Friendship;
  let _friendshipDefinition;

  beforeEach(() => {
    _friendshipDefinition = {
      _friend: new mongoose.Types.ObjectId(),
      _user: new mongoose.Types.ObjectId()
    };
    spyOn(console, 'log').and.returnValue();
    Friendship = mock.reRequire('./friendship').Friendship;
  });

  afterEach(() => {
    delete mongoose.models.Friendship;
    delete mongoose.modelSchemas.Friendship;
    mock.stopAll();
  });

  it('should validate a document', () => {
    let friendship = new Friendship(_friendshipDefinition);
    const err = friendship.validateSync();
    expect(err).toBeUndefined();
  });

  it('should be invalid if user ID is undefined', () => {
    _friendshipDefinition._user = undefined;
    let friendship = new Friendship(_friendshipDefinition);
    const err = friendship.validateSync();
    expect(err.errors._user.properties.type).toEqual('required');
  });

  it('should be invalid if friend ID is undefined', () => {
    _friendshipDefinition._friend = undefined;
    let friendship = new Friendship(_friendshipDefinition);
    const err = friendship.validateSync();
    expect(err.errors._friend.properties.type).toEqual('required');
  });

  it('should generate timestamps automatically', () => {
    expect(Friendship.schema.paths.dateCreated).toBeDefined();
    expect(Friendship.schema.paths.dateUpdated).toBeDefined();
  });

  it('should beautify native mongo errors', () => {
    let found = Friendship.schema.plugins.filter((plugin) => {
      return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
    })[0];
    expect(found).toBeDefined();
  });
});

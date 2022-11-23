const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('Friendship schema', () => {
  let Friendship;
  let _friendshipDefinition;

  beforeEach(() => {
    _friendshipDefinition = {
      _friend: new mongoose.Types.ObjectId(),
      _user: new mongoose.Types.ObjectId(),
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
      return plugin.fn.name === 'MongoDbErrorHandlerPlugin';
    })[0];
    expect(found).toBeDefined();
  });

  describe('getFriendshipsByUserId', () => {
    it('should get friendships for a user', (done) => {
      const userId = mongoose.Types.ObjectId();
      let _populate1Args;
      let _populate2Args;
      let _query;

      const context = {
        find(query) {
          _query = query;
          return {
            populate(path, fields) {
              _populate1Args = { path, fields };
              return {
                populate(path, fields) {
                  _populate2Args = { path, fields };
                  return {
                    lean() {
                      return Promise.resolve();
                    },
                  };
                },
              };
            },
          };
        },
      };
      Friendship.getFriendshipsByUserId
        .call(context, userId)
        .then(() => {
          expect(_query['$or'][0]._user).toEqual(userId);
          expect(_query['$or'][1]._friend).toEqual(userId);
          expect(_populate1Args).toEqual({
            path: '_friend',
            fields: 'firstName lastName',
          });
          expect(_populate2Args).toEqual({
            path: '_user',
            fields: 'firstName lastName',
          });
          done();
        })
        .catch(done.fail);
    });

    it('should fail if user id not provided', (done) => {
      const context = {};
      Friendship.getFriendshipsByUserId
        .call(context, undefined)
        .catch((err) => {
          expect(err.name).toEqual('FriendshipValidationError');
          expect(err.message).toEqual('Please provide a user ID.');
          done();
        });
    });
  });
});

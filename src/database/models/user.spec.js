const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('user model', () => {
  let User;

  beforeEach(() => {
    User = mock.reRequire('./user');
  });

  afterEach(() => {
    delete mongoose.models.User;
    delete mongoose.modelSchemas.User;
    mock.stopAll();
  });

  it('should add a user record', () => {
    let user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  it('should be invalid if firstName is empty', () => {
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('required');

    user = new User({ firstName: '   ' });
    err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('required');
  });

  it('should be invalid if firstName is not between 1 and 50 characters', () => {
    let user = new User({ firstName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    const err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('maxlength');
  });

  it('should be invalid if firstName contains duplicate characters', () => {
    let user = new User({ firstName: 'aaa' });
    const err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('hasDuplicateChars');
  });

  it('should be invalid if firstName contains symbols or numbers', () => {
    let user = new User({ firstName: 'abc-abc' });
    let err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('isAlpha');

    user = new User({ firstName: '123' });
    err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('isAlpha');
  });

  it('should be invalid if lastName is empty', () => {
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('required');

    user = new User({ lastName: '   ' });
    err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('required');
  });

  it('should be invalid if lastName is not between 1 and 50 characters', () => {
    let user = new User({ lastName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    const err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('maxlength');
  });

  it('should be invalid if lastName contains duplicate characters', () => {
    let user = new User({ lastName: 'aaa' });
    const err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('hasDuplicateChars');
  });

  it('should be invalid if lastName contains symbols or numbers', () => {
    let user = new User({ lastName: 'abc-abc' });
    let err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('isAlpha');

    user = new User({ lastName: '123' });
    err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('isAlpha');
  });

  it('should be invalid if emailAddress is empty', () => {
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.emailAddress.properties.type).toEqual('required');

    user = new User({ emailAddress: '   ' });
    err = user.validateSync();
    expect(err.errors.emailAddress.properties.type).toEqual('required');
  });

  it('should be invalid if emailAddress is not formatted correctly', (done) => {
    let user = new User({ emailAddress: 'invalid.email' });
    user.validate().catch(err => {
      expect(err.errors.emailAddress.properties.type).toEqual('isEmail');
      done();
    });
  });

  it('should convert emailAddress to lowercase', () => {
    let user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'Foo@Bar.com',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    user.validateSync();
    expect(user.emailAddress).toEqual('foo@bar.com');
  });

  it('should check if emailAddress is unique', () => {
    let found = User.schema.plugins.filter(plugin => {
      return (plugin.fn.name === 'MongoDbErrorHandlerPlugin');
    })[0];
    expect(found).toBeDefined();
  });

  it('should trim whitespace from firstName, lastName, and emailAddress', () => {
    let user = new User({
      firstName: ' Foo ',
      lastName: ' Bar   ',
      emailAddress: '   foo@bar.com ',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    user.validateSync();
    expect(user.firstName).toEqual('Foo');
    expect(user.lastName).toEqual('Bar');
    expect(user.emailAddress).toEqual('foo@bar.com');
  });

  it('should generate timestamps automatically', () => {
    expect(User.schema.paths.dateCreated).toBeDefined();
    expect(User.schema.paths.dateUpdated).toBeDefined();
  });

  it('should set and validate an encrypted password', (done) => {
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '1234567',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('1234567').then(() => {
      user.validatePassword('1234567').then(() => {
        expect(user.password).not.toEqual('1234567');
        done();
      });
    });
  });

  it('should fail if the password is empty', (done) => {
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '       ',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('       ').catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('should fail if the password is too short', (done) => {
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: 'foo',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('abc').catch((err) => {
      expect(err.errors.password.message).toEqual('Your password must be between 7 and 50 characters long.');
      done();
    });
  });

  it('should fail if the password is too long', (done) => {
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: 'foo',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('1234512345123451234512345123451234512345123451234512345').catch((err) => {
      expect(err.errors.password.message).toEqual('Your password must be between 7 and 50 characters long.');
      done();
    });
  });

  it('should throw an error if the password is invalid', (done) => {
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: 'foobar',
      dateLastLoggedIn: new Date()
    });

    user.setPassword('1234567')
      .then(() => user.validatePassword('abc'))
      .catch(err => {
        expect(err.message).toEqual('Password invalid.');
        done();
      });
  });
});

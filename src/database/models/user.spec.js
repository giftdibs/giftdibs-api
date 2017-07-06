const mongoose = require('mongoose');
mongoose.Promise = Promise;

describe('user model', () => {
  it('should add a user record', () => {
    const User = require('./user');
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
    const User = require('./user');
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('required');

    user = new User({ firstName: '   ' });
    err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('required');
  });

  it('should be invalid if firstName is not between 1 and 50 characters', () => {
    const User = require('./user');
    let user = new User({ firstName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    const err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('maxlength');
  });

  it('should be invalid if firstName contains duplicate characters', () => {
    const User = require('./user');
    let user = new User({ firstName: 'aaa' });
    const err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('hasDuplicateChars');
  });

  it('should be invalid if firstName contains symbols or numbers', () => {
    const User = require('./user');
    let user = new User({ firstName: 'abc-abc' });
    let err = user.validateSync()
    expect(err.errors.firstName.properties.type).toEqual('isAlpha');

    user = new User({ firstName: '123' });
    err = user.validateSync();
    expect(err.errors.firstName.properties.type).toEqual('isAlpha');
  });

  it('should be invalid if lastName is empty', () => {
    const User = require('./user');
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('required');

    user = new User({ lastName: '   ' });
    err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('required');
  });

  it('should be invalid if lastName is not between 1 and 50 characters', () => {
    const User = require('./user');
    let user = new User({ lastName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    const err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('maxlength');
  });

  it('should be invalid if lastName contains duplicate characters', () => {
    const User = require('./user');
    let user = new User({ lastName: 'aaa' });
    const err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('hasDuplicateChars');
  });

  it('should be invalid if lastName contains symbols or numbers', () => {
    const User = require('./user');
    let user = new User({
      lastName: 'abc-abc'
    });
    let err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('isAlpha');

    user = new User({ lastName: '123' });
    err = user.validateSync();
    expect(err.errors.lastName.properties.type).toEqual('isAlpha');
  });

  it('should be invalid if emailAddress is empty', () => {
    const User = require('./user');
    let user = new User();
    let err = user.validateSync();
    expect(err.errors.emailAddress.properties.type).toEqual('required');

    user = new User({ emailAddress: '   ' });
    err = user.validateSync();
    expect(err.errors.emailAddress.properties.type).toEqual('required');
  });

  it('should be invalid if emailAddress is not formatted correctly', (done) => {
    const User = require('./user');
    let user = new User({ emailAddress: 'invalid.email' });
    user.validate().catch(err => {
      expect(err.errors.emailAddress.properties.type).toEqual('isEmail');
      done();
    });
  });

  it('should convert emailAddress to lowercase', () => {
    const User = require('./user');
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

  it('should trim whitespace from firstName, lastName, and emailAddress', () => {
    const User = require('./user');
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
    const User = require('./user');
    expect(User.schema.paths.dateCreated).toBeDefined();
    expect(User.schema.paths.dateUpdated).toBeDefined();
  });

  it('should set and validate an encrypted password', (done) => {
    const User = require('./user');
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('12345').then(() => {
      user.validatePassword('12345').then(() => {
        expect(user.password).not.toEqual('12345');
        done();
      });
    });
  });

  it('should throw an error if the password is invalid', (done) => {
    const User = require('./user');
    const user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    user.setPassword('12345').then(() => {
      user.validatePassword('abc').catch(err => {
        expect(err.status).toEqual(401);
        done();
      });
    });
  });
});

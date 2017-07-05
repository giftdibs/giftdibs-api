const mongoose = require('mongoose');
mongoose.Promise = Promise;

describe('user model', () => {
  it('should add a user record', (done) => {
    const User = require('./user');
    let user = new User({
      firstName: 'Foo',
      lastName: 'Bar',
      emailAddress: 'foo@bar.com',
      password: '12345',
      dateLastLoggedIn: new Date()
    });
    user.validate(err => {
      expect(err).toEqual(null);
      done();
    });
  });

  it('should be invalid if firstName is empty', (done) => {
    const User = require('./user');
    let user = new User();
    user.validate(err => {
      expect(err.errors.firstName.properties.type).toEqual('required');
      user = new User({ firstName: '   ' });
      user.validate(err => {
        expect(err.errors.firstName.properties.type).toEqual('required');
        done();
      });
    });
  });

  it('should be invalid if firstName is not between 1 and 50 characters', () => {});

  it('should be invalid if firstName contains symbols or numbers', () => {});

  it('should be invalid if lastName is empty', (done) => {
    const User = require('./user');
    let user = new User();
    user.validate(err => {
      expect(err.errors.lastName.properties.type).toEqual('required');
      done();
    });
  });

  it('should be invalid if lastName is not between 1 and 50 characters', () => {});

  it('should be invalid if lastName contains symbols or numbers', () => {});

  it('should be invalid if emailAddress is empty', (done) => {
    const User = require('./user');
    let user = new User();
    user.validate(err => {
      expect(err.errors.emailAddress.properties.type).toEqual('required');
      done();
    });
  });

  it('should be invalid if emailAddress is not unique', () => {});

  it('should be invalid if emailAddress is not formatted correctly', (done) => {
    const User = require('./user');
    let user = new User({
      emailAddress: 'invalid.email'
    });
    user.validate(err => {
      expect(err.errors.emailAddress.properties.type).toEqual('isEmail');
      done();
    });
  });

  it('should convert emailAddress to lowercase', () => {});

  it('should trim whitespace from firstName, lastName, and emailAddress', () => {});

  it('should generate timestamps automatically', () => {});

  it('should allow each model to validate the password', () => {});

  it('should throw an error if the password is invalid', () => {});

  it('should allow each model to set the password', () => {});
});

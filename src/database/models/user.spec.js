const mongoose = require('mongoose');
const mock = require('mock-require');

mongoose.Promise = Promise;

describe('User schema', () => {
  describe('fields', () => {
    let User;
    let updateDocumentUtil;

    beforeEach(() => {
      updateDocumentUtil = mock.reRequire('../utils/update-document');
      spyOn(updateDocumentUtil, 'updateDocument').and.returnValue();
      spyOn(console, 'log').and.returnValue();
      User = mock.reRequire('./user').User;
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
        dateLastLoggedIn: new Date(),
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
    });

    it('should fail if firstName is empty', () => {
      let user = new User();
      let err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('required');

      user = new User({ firstName: '   ' });
      err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('required');
    });

    it('should fail if firstName is not between 1 and 50 characters', () => {
      const user = new User({
        firstName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      });
      const err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('maxlength');
    });

    it('should fail if firstName contains duplicate characters', () => {
      let user = new User({ firstName: 'aaa' });
      const err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('hasDuplicateChars');
    });

    it('should fail if firstName contains symbols or numbers', () => {
      let user = new User({ firstName: 'abc-abc' });
      let err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('isAlpha');

      user = new User({ firstName: '123' });
      err = user.validateSync();
      expect(err.errors.firstName.properties.type).toEqual('isAlpha');
    });

    it('should fail if lastName is empty', () => {
      let user = new User();
      let err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('required');

      user = new User({ lastName: '   ' });
      err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('required');
    });

    it('should fail if lastName is not between 1 and 50 characters', () => {
      const user = new User({
        lastName: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      });
      const err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('maxlength');
    });

    it('should fail if lastName contains duplicate characters', () => {
      let user = new User({ lastName: 'aaa' });
      const err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('hasDuplicateChars');
    });

    it('should fail if lastName contains symbols or numbers', () => {
      let user = new User({ lastName: 'abc-abc' });
      let err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('isAlpha');

      user = new User({ lastName: '123' });
      err = user.validateSync();
      expect(err.errors.lastName.properties.type).toEqual('isAlpha');
    });

    it('should fail if emailAddress is empty', () => {
      let user = new User();
      let err = user.validateSync();
      expect(err.errors.emailAddress.properties.type).toEqual('required');

      user = new User({ emailAddress: '   ' });
      err = user.validateSync();
      expect(err.errors.emailAddress.properties.type).toEqual('required');
    });

    it('should fail if emailAddress is not formatted correctly', (done) => {
      const user = new User({ emailAddress: 'invalid.email' });
      user.validate().catch((err) => {
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
        dateLastLoggedIn: new Date(),
      });
      user.validateSync();
      expect(user.emailAddress).toEqual('foo@bar.com');
    });

    it('should beautify native mongo errors', () => {
      let found = User.schema.plugins.filter((plugin) => {
        return plugin.fn.name === 'MongoDbErrorHandlerPlugin';
      })[0];
      expect(found).toBeDefined();
    });

    it('should trim whitespace from fields', () => {
      let user = new User({
        firstName: ' Foo ',
        lastName: ' Bar   ',
        emailAddress: '   foo@bar.com ',
        password: '12345',
        dateLastLoggedIn: new Date(),
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
        dateLastLoggedIn: new Date(),
      });
      user
        .setPassword('1234567')
        .then(() => {
          user
            .confirmPassword('1234567')
            .then(() => {
              expect(user.password).not.toEqual('1234567');
              done();
            })
            .catch(done.fail);
        })
        .catch(done.fail);
    });

    it('should fail if the password is empty', (done) => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: '       ',
        dateLastLoggedIn: new Date(),
      });
      user.setPassword('       ').catch((err) => {
        expect(err).toBeDefined();
        done();
      });
    });

    it('should fail if the password is null', (done) => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: null,
        dateLastLoggedIn: new Date(),
      });
      user.setPassword(null).catch((err) => {
        expect(err).toBeDefined();
        expect(err.errors.password.message).toEqual(
          'Please provide a password.'
        );
        done();
      });
    });

    it('should fail if the password is too short', (done) => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foo',
        dateLastLoggedIn: new Date(),
      });
      user.setPassword('abc').catch((err) => {
        expect(err.errors.password.message).toEqual(
          'Your password must be between 7 and 50 characters long.'
        );
        done();
      });
    });

    it('should fail if the password is too long', (done) => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foo',
        dateLastLoggedIn: new Date(),
      });
      user
        .setPassword('1234512345123451234512345123451234512345123451234512345')
        .catch((err) => {
          expect(err.errors.password.message).toEqual(
            'Your password must be between 7 and 50 characters long.'
          );
          done();
        });
    });

    it('should throw an error if the password is invalid', (done) => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
      });

      user
        .setPassword('1234567')
        .then(() => user.confirmPassword('abc'))
        .catch((err) => {
          expect(err.message).toEqual(
            'That password did not match what we have on record.'
          );
          done();
        });
    });

    it('should handle errors from the password hash utility', (done) => {
      const user = new User({
        password: undefined,
      });
      user.confirmPassword(undefined).catch((err) => {
        expect(err.message).toEqual(
          'That password did not match what we have on record.'
        );
        done();
      });
    });

    it('should set the reset password token and expiration', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
      });

      user.setResetPasswordToken();
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpires).toBeDefined();
    });

    it('should unset the reset password token and expiration', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
        resetPasswordToken: 'abc123',
        resetPasswordExpires: new Date(),
      });

      user.unsetResetPasswordToken();
      expect(user.resetPasswordToken).toBeUndefined();
      expect(user.resetPasswordExpires).toBeUndefined();
    });

    it('should reset the email verification', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
      });

      user.resetEmailAddressVerification();
      expect(user.emailAddressVerified).toEqual(false);
      expect(user.emailAddressVerificationToken).toBeDefined();
    });

    it('should verify email', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
        emailAddressVerificationToken: 'abc123',
      });

      const result = user.verifyEmailAddress('abc123');
      expect(user.emailAddressVerified).toEqual(true);
      expect(user.emailAddressVerificationToken).toBeUndefined();
      expect(result).toEqual(true);
    });

    it('should return false for mismatched email verification tokens', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
        emailAddressVerificationToken: 'abc123',
      });

      const result = user.verifyEmailAddress('foobar');
      expect(user.emailAddressVerificationToken).toEqual('abc123');
      expect(result).toEqual(false);
    });

    it('should update certain fields', () => {
      const user = new User({
        firstName: 'Foo',
        lastName: 'Bar',
        emailAddress: 'foo@bar.com',
        password: 'foobar',
        dateLastLoggedIn: new Date(),
      });
      const formData = {
        firstName: 'Test',
      };

      user.updateSync(formData);

      expect(updateDocumentUtil.updateDocument).toHaveBeenCalledWith(
        user,
        ['firstName', 'lastName', 'emailAddress', 'facebookId'],
        formData
      );
    });
  });

  describe('remove referenced documents', () => {
    const {
      // MockDib,
      MockFriendship,
      MockWishList,
    } = require('../../shared/testing');

    beforeEach(() => {
      delete mongoose.models.User;
      delete mongoose.modelSchemas.User;

      // MockDib.reset();
      MockFriendship.reset();
      MockWishList.reset();

      // mock('./dib', { Dib: MockDib });
      mock('./friendship', { Friendship: MockFriendship });
      mock('./wish-list', { WishList: MockWishList });
    });

    afterEach(() => {
      mock.stopAll();
    });

    it('should also remove referenced documents', (done) => {
      const wishListRemoveSpy = spyOn(MockWishList, 'remove').and.returnValue(
        Promise.resolve()
      );

      const friendshipRemoveSpy = spyOn(
        MockFriendship,
        'remove'
      ).and.returnValue(Promise.resolve());

      const { removeReferencedDocuments } = mock.reRequire('./user');

      removeReferencedDocuments(
        {
          _id: 'userid',
        },
        (err) => {
          expect(wishListRemoveSpy).toHaveBeenCalledWith({
            _user: 'userid',
          });
          expect(friendshipRemoveSpy).toHaveBeenCalledWith({
            $or: [{ _user: 'userid' }, { _friend: 'userid' }],
          });
          expect(err).toBeUndefined();
          done();
        }
      );
    });

    it('should handle errors', (done) => {
      spyOn(MockWishList, 'remove').and.returnValue(
        Promise.reject(new Error('Some error'))
      );

      const { removeReferencedDocuments } = mock.reRequire('./user');

      removeReferencedDocuments({}, (err) => {
        expect(err.message).toEqual('Some error');
        done();
      });
    });
  });
});

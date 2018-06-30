const mongoose = require('mongoose');

function tick(callback) {
  setTimeout(callback, 0);
}

function assignSave(model) {
  model.prototype.save = function () {
    model.lastTouched = this;
    return model.overrides.save.returnWith();
  };
}

function assignFind(model) {
  model.find = function (query) {
    const promise = model.overrides.find.returnWith();

    const lean = () => {
      return promise;
    };

    const populate = (field, subFields) => {
      model.populatedFields[field] = subFields;

      return { lean, populate };
    };

    const limit = (num) => {
      promise.lean = lean;
      promise.select = select;
      promise.populate = populate;
      model.limit = num;
      return promise;
    };

    const where = () => {
      return {
        in() {
          return {
            populate
          }
        }
      };
    };

    const select = (fields) => {
      model.selectedFields = fields;
      return {
        lean
      };
    };

    // Save the query to be used by specs.
    model.overrides.find.lastQuery = query;

    return {
      limit,
      lean,
      populate,
      select,
      where
    };
  }
}

function assignReset(Model) {
  Model.reset = function () {
    Model.lastTouched = undefined;
    Model.populatedFields = {};
    Model.overrides = {
      constructorDefinition: {},
      find: {
        returnWith() {
          return Promise.resolve([
            new Model(),
            new Model()
          ]);
        }
      },
      save: {
        returnWith() {
          return Promise.resolve(Model.lastTouched);
        }
      }
    };
  }
}

function assignConfirmUserOwnership(Model) {
  Model.confirmUserOwnership = function () {
    return Promise.resolve(new Model());
  };
}

class MockDocument {
  constructor() {
    this.remove = () => {};
    this.updateSync = () => {};
    this._id = mongoose.Types.ObjectId();
  }
}

MockDocument.remove = function () {
  return Promise.resolve();
};

class MockWishList extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {
      _user: {
        _id: mongoose.Types.ObjectId()
      }
    };

    Object.assign(
      this,
      defaults,
      definition,
      MockWishList.overrides.constructorDefinition
    );

    this.gifts = this.gifts || [];

    this.gifts.create = (giftDefinition) => {
      return Object.assign({
        _id: new mongoose.Types.ObjectId()
      }, giftDefinition);
    };

    this.gifts.id = (id) => {
      const found = this.gifts.find(gift => gift._id === id);
      return found;
    };

    this.gifts.forEach((gift) => {
      gift.remove = () => {};
      gift.updateSync = () => {};
    });

    this.set = () => {};
  }
}

MockWishList.confirmUserOwnershipByGiftId = function () {};

MockWishList.findAuthorized = function () {
  return Promise.resolve([]);
};

MockWishList.findAuthorizedById = function () {};

MockWishList.findAuthorizedByGiftId = function () {
  return Promise.resolve();
};

MockWishList.removeDibById = function () {
  return Promise.resolve();
};

MockWishList.updateDibById = function () {
  return Promise.resolve();
};

MockWishList.createDib = function () {
  return Promise.resolve();
};

// class MockGift extends MockDocument {
//   constructor(definition = {}) {
//     super();

//     const defaults = {
//       externalUrls: []
//     };

//     Object.assign(this, defaults, definition);

//     if (!this.externalUrls) {
//       this.externalUrls = [];
//     }

//     this.externalUrls.id = () => {};
//   }
// }

class MockExternalUrl extends MockDocument {}

// class MockDib extends MockDocument {
//   constructor(definition = {}) {
//     super();

//     const defaults = {};

//     Object.assign(
//       this,
//       defaults,
//       definition,
//       MockDib.overrides.constructorDefinition
//     );
//   }
// }

class MockFriendship extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {};

    Object.assign(
      this,
      defaults,
      definition,
      MockFriendship.overrides.constructorDefinition
    );
  }
}

MockFriendship.getFriendshipsByUserId = function () {
  return Promise.resolve();
};

class MockUser extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {};

    this.resetEmailAddressVerification = {};

    Object.assign(
      this,
      defaults,
      definition,
      MockUser.overrides.constructorDefinition
    );
  }

  confirmPassword() {}
}

function MockRequest(options = {}) {
  return Object.assign({}, {
    body: {},
    params: {},
    query: {},
    user: {
      _id: mongoose.Types.ObjectId()
    }
  }, options);
}

function MockResponse() {
  this.json = function (output) {
    this.json.output = output;
  };
}

assignFind(MockWishList);
// assignFind(MockGift);
// assignFind(MockDib);
assignFind(MockFriendship);
assignFind(MockUser);

assignSave(MockWishList);
// assignSave(MockGift);
// assignSave(MockDib);
assignSave(MockFriendship);
assignSave(MockUser);

assignReset(MockWishList);
// assignReset(MockGift);
// assignReset(MockDib);
assignReset(MockFriendship);
assignReset(MockUser);

assignConfirmUserOwnership(MockWishList);
// assignConfirmUserOwnership(MockGift);
// assignConfirmUserOwnership(MockDib);
assignConfirmUserOwnership(MockFriendship);
assignConfirmUserOwnership(MockUser);

module.exports = {
  tick,
  // MockDib,
  MockFriendship,
  // MockGift,
  MockWishList,
  MockExternalUrl,
  MockUser,
  MockRequest,
  MockResponse
};

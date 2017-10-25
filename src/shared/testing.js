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
  model.find = function () {
    const promise = model.overrides.find.returnWith();

    const lean = () => {
      return promise;
    };

    const populate = (field, subFields) => {
      model.populatedFields[field] = subFields;

      return { lean };
    };

    const limit = () => {
      promise.lean = lean;
      promise.populate = populate;
      return promise;
    };

    const select = () => {
      return {
        populate
      };
    };

    return {
      limit,
      lean,
      populate,
      select
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

class MockDocument {
  constructor() {
    this.remove = () => {};
    this.update = () => {};
    this._id = 'abc123';
  }
}

MockDocument.remove = function () {
  return Promise.resolve();
};

class MockWishList extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {};

    Object.assign(this, defaults, definition, MockWishList.overrides.constructorDefinition);

    this.set = () => {};
  }
}

// MockWishList.getById = function () {
//   const wishList = new MockWishList(MockWishList.overrides.constructorDefinition);
//   MockWishList.lastTouched = wishList;
//   return Promise.resolve(wishList);
// };

// MockWishList.getGiftById = function (wishListId, giftId) {
//   return MockWishList
//     .getById()
//     .then((wishList) => {
//       const gift = wishList.gifts.filter((g) => g._id === giftId)[0];
//       return { wishList, gift };
//     });
// };

class MockGift extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {
      externalUrls: []
    };

    Object.assign(this, defaults, definition);

    if (!this.externalUrls) {
      this.externalUrls = [];
    }

    this.externalUrls.id = () => {};
  }
}

class MockExternalUrl extends MockDocument {}

class MockDib extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {};

    Object.assign(this, defaults, definition, MockDib.overrides.constructorDefinition);
  }
}

function MockRequest(options = {}) {
  return Object.assign({}, {
    body: {},
    params: {},
    query: {}
  }, options);
}

function MockResponse() {
  this.json = function (output) {
    this.json.output = output;
  };
}

assignFind(MockWishList);
assignFind(MockGift);
assignFind(MockDib);

assignSave(MockWishList);
assignSave(MockGift);
assignSave(MockDib);

assignReset(MockWishList);
assignReset(MockGift);
assignReset(MockDib);

module.exports = {
  tick,
  MockDib,
  MockGift,
  MockWishList,
  MockExternalUrl,
  MockRequest,
  MockResponse
};

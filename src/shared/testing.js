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

    // Save the query to be used by specs.
    model.overrides.find.lastQuery = query;

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

    Object.assign(
      this,
      defaults,
      definition,
      MockWishList.overrides.constructorDefinition
    );

    this.set = () => {};
  }
}

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

    Object.assign(
      this,
      defaults,
      definition,
      MockDib.overrides.constructorDefinition
    );
  }
}

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
assignFind(MockFriendship);

assignSave(MockWishList);
assignSave(MockGift);
assignSave(MockDib);
assignSave(MockFriendship);

assignReset(MockWishList);
assignReset(MockGift);
assignReset(MockDib);
assignReset(MockFriendship);

module.exports = {
  tick,
  MockDib,
  MockFriendship,
  MockGift,
  MockWishList,
  MockExternalUrl,
  MockRequest,
  MockResponse
};

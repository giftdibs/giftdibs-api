function tick(callback) {
  setTimeout(callback, 0);
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

class MockExternalUrl extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {};

    Object.assign(this, defaults, definition);
  }
}

class MockGift extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {
      externalUrls: []
    };

    Object.assign(this, defaults, definition);

    this.externalUrls.id = (id) => {
      if (!id) {
        return;
      }

      return this.externalUrls.filter((externalUrl) => {
        return (externalUrl instanceof MockExternalUrl && externalUrl._id === id);
      })[0];
    };
  }
}

MockGift.getById = function (wishListId, giftId) {
  return MockWishList
    .getById()
    .then((wishList) => {
      const gift = wishList.gifts.filter((g) => g._id === giftId)[0];
      return { wishList, gift };
    });
};

class MockWishList extends MockDocument {
  constructor(definition = {}) {
    super();

    const defaults = {
      gifts: []
    };

    Object.assign(this, defaults, definition, MockWishList.overrides.constructorDefinition);

    this.save = () => {
      this.gifts.forEach(gift => {
        if (!gift._id) {
          gift._id = 'abc123';
        }
      });

      MockWishList.lastTouched = this;

      return MockWishList.overrides.save.returnWith();
    };

    this.set = () => {};

    this.gifts.id = () => {};
  }
}

MockWishList.find = function () {
  const lean = () => {
    return MockWishList.overrides.find.returnWith();
  };

  const populate = (field, subFields) => {
    MockWishList.populatedFields[field] = subFields;
    return { lean };
  };

  const limit = () => {
    return {
      populate
    };
  };

  return {
    limit,
    lean,
    populate
  };
};

MockWishList.getById = function () {
  const wishList = new MockWishList(MockWishList.overrides.constructorDefinition);
  MockWishList.lastTouched = wishList;
  return Promise.resolve(wishList);
};

MockWishList.reset = function () {
  MockWishList.lastTouched = undefined;
  MockWishList.populatedFields = {};
  MockWishList.overrides = {
    constructorDefinition: {},
    find: {
      returnWith() {
        return Promise.resolve([
          new MockWishList(),
          new MockWishList()
        ]);
      }
    },
    save: {
      returnWith() {
        return Promise.resolve(MockWishList.lastTouched);
      }
    }
  };
};

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

module.exports = {
  tick,
  MockGift,
  MockWishList,
  MockExternalUrl,
  MockRequest,
  MockResponse
};

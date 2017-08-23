function tick(callback) {
  setTimeout(callback, 0);
}

function MockWishList() {
  this.gifts = [];
  this.save = () => {
    this.gifts.forEach(gift => {
      gift._id = 'abc123';
    });
    return Promise.resolve(this);
  };
}

MockWishList.getById = function () {
  const wishList = new MockWishList();
  MockWishList.lastCreated = wishList;
  return Promise.resolve(wishList);
};

MockWishList.reset = function () {
  MockWishList.lastCreated = undefined;
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
  MockWishList,
  MockRequest,
  MockResponse
};

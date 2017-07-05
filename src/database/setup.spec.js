const Mongoose = require('mongoose').Mongoose;
const mongoose = new Mongoose();

const Mockgoose = require('mockgoose').Mockgoose;
const mockgoose = new Mockgoose(mongoose);

module.exports = (done) => {
  mockgoose.helper
    .reset()
    .then(() => {
      mockgoose.prepareStorage()
        .then(() => {
          mongoose.connect('mongodb://example.com/TestingDB', (err) => {
            done(err);
          });
        });
    });
}

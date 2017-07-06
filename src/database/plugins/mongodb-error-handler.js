const mongoose = require('mongoose');

const errorHandler = (err, doc, next) => {
  if (err.name !== 'MongoError' || err.code !== 11000) {
    next(err);
    return;
  }

  const validationError = new mongoose.Error.ValidationError();
  const path = err.message.split('index: ')[1].split('_')[0];
  const value = err.message.match(/\{\s:\s"?([^"\s]+)/)[1];

  validationError.errors[path] = validationError.errors[path] || {};
  validationError.errors[path].kind = 'unique';
  validationError.errors[path].value = value;
  validationError.errors[path].path = path;
  validationError.errors[path].message = '{0} is expected to be unique.'.replace('{0}', path);
  validationError.errors[path].reason = err.message;
  validationError.errors[path].name = err.name;

  next(validationError);
};

function MongoDbErrorHandlerPlugin(schema) {
  schema.post('save', errorHandler);
  schema.post('update', errorHandler);
  schema.post('findOneAndUpdate', errorHandler);
  schema.post('insertMany', errorHandler);
  schema.post('validate', errorHandler);
}

module.exports = {
  errorHandler,
  MongoDbErrorHandlerPlugin
}

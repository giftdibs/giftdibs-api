const mongoose = require('mongoose');

// Beautifies native MongoDB errors.
function errorHandler(err, doc, next) {
  if (err.name !== 'BulkWriteError' && err.code !== 11000) {
    next(err);
    return;
  }

  const schema = this.schema;
  const validationError = new mongoose.Error.ValidationError();
  const pathKey = err.message.split('index: ')[1].split('_')[0].split('$')[1];
  const value = err.message.match(/\{\s:\s"?([^"\s]+)/)[1];

  let errorMessage;
  if (schema.paths[pathKey].options.unique[1]) {
    errorMessage = schema.paths[pathKey].options.unique[1];
  } else {
    errorMessage = 'The field, {0}, is expected to be unique.'.replace('{0}', pathKey);
  }

  validationError.errors[pathKey] = validationError.errors[pathKey] || {};
  validationError.errors[pathKey].kind = 'unique';
  validationError.errors[pathKey].value = value;
  validationError.errors[pathKey].path = pathKey;
  validationError.errors[pathKey].message = errorMessage;

  next(validationError);
};

function MongoDbErrorHandlerPlugin(schema) {
  errorHandler.bind({ schema });
  schema.post('save', errorHandler);
  schema.post('update', errorHandler);
  schema.post('findOneAndUpdate', errorHandler);
  schema.post('insertMany', errorHandler);
  schema.post('validate', errorHandler);
}

module.exports = {
  MongoDbErrorHandlerPlugin
}

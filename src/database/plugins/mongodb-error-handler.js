const mongoose = require('mongoose');

// Beautifies native MongoDB errors.
function errorHandler(mongoError, doc, next) {
  if (mongoError.name !== 'BulkWriteError' && mongoError.code !== 11000) {
    next(mongoError);
    return;
  }

  const schema = this.schema;
  const validationError = new mongoose.Error.ValidationError();
  try {
    const pathKey = mongoError.message.split('index: ')[1].split('_')[0];
    const value = mongoError.message.match(/\{\s\w*:\s"([^"\s]+)/)[1];

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
  } catch (err) {
    console.error('Unable to parse Mongo Error:', err.message, mongoError.message, validationError);
  }

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

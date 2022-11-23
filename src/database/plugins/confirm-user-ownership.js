function ConfirmUserOwnershipPlugin(schema, options) {
  if (!options.userIdField) {
    options.userIdField = '_user';
  }

  schema.statics.confirmUserOwnership = function (docId, userId) {
    if (!docId) {
      return Promise.reject(options.errors.validation);
    }

    const model = this;

    return model
      .find({ _id: docId })
      .limit(1)
      .then((docs) => {
        const doc = docs[0];

        if (!doc) {
          return Promise.reject(options.errors.notFound);
        }

        if (
          doc[options.userIdField] &&
          userId.toString() !== doc[options.userIdField].toString()
        ) {
          return Promise.reject(options.errors.permission);
        }

        return doc;
      });
  };
}

module.exports = {
  ConfirmUserOwnershipPlugin,
};

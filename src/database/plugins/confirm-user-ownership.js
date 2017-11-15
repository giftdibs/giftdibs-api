function ConfirmUserOwnershipPlugin(schema, options) {
  schema.statics.confirmUserOwnership = function (docId, userId) {
    if (!docId) {
      return Promise.reject(options.errors.validation);
    }

    return this
      .find({ _id: docId })
      .limit(1)
      .then((docs) => {
        const doc = docs[0];

        if (!doc) {
          return Promise.reject(options.errors.notFound);
        }

        if (userId.toString() !== doc._user.toString()) {
          return Promise.reject(options.errors.permission);
        }

        return doc;
      });
  };
}

module.exports = {
  ConfirmUserOwnershipPlugin
};

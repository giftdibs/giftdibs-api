const updateSubDocuments = (doc, fields, values) => {
  const schemaFields = Object.keys(doc.toObject());

  schemaFields.forEach((key) => {
    const subdocs = doc[key];
    const formData = values[key];

    if (fields.indexOf(key) === -1) {
      return;
    }

    if (!Array.isArray(formData) || !Array.isArray(subdocs)) {
      return;
    }

    if (typeof subdocs.id !== 'function') {
      return;
    }

    // Remove subdocuments that are not included with the form data.
    const deleteIds = [];
    subdocs.forEach((subdoc) => {
      const found = formData.find((data) => {
        return (subdoc._id.toString() === data._id);
      });

      if (!found) {
        deleteIds.push(subdoc._id);
      }
    });

    // Need to delete each document individually so all middleware is run.
    deleteIds.forEach((deleteId) => subdocs.id(deleteId).remove());

    // Add a new subdocument if no _id provided.
    formData.forEach((data) => {
      if (data._id) {
        return;
      }

      subdocs.push(data);
    });

    // Update existing subdocuments.
    formData.forEach((data) => {
      if (!data._id) {
        return;
      }

      const subdoc = subdocs.id(data._id);

      if (subdoc && typeof subdoc.updateSync === 'function') {
        subdoc.updateSync(data);
      }
    });
  });
};

function updateDocument(doc, fields, values) {
  const changes = {};

  fields.forEach((field) => {
    if (values[field] === undefined) {
      return;
    }

    // Don't update subdocuments in this step!
    // (They have their own method, below.)
    if (doc[field] && typeof doc[field].id === 'function') {
      return;
    }

    // Client wishes to unset a property by sending 'null'.
    if (values[field] === null) {
      values[field] = undefined;
    }

    // Collect change:
    changes[field] = values[field];
  });

  // Apply changes.
  for (let key in changes) {
    doc.set(key, changes[key]);
  }

  updateSubDocuments(doc, fields, values);
}

module.exports = { updateDocument };

const updateSubDocuments = (doc, values) => {
  const schemaFields = Object.keys(doc.toObject());

  schemaFields.forEach((key) => {
    const field = doc[key];
    const formData = values[key];

    if (!Array.isArray(formData) || !Array.isArray(field)) {
      return;
    }

    if (typeof field.id !== 'function') {
      return;
    }

    // Remove subdocuments that are not included with the form data.
    const deleteIds = [];
    field.forEach((subdoc) => {
      const found = formData.find((data) => {
        return (subdoc._id.toString() === data._id);
      });

      if (!found) {
        deleteIds.push(subdoc._id);
      }
    });

    // Need to delete each document individually so all middleware is run.
    deleteIds.forEach((deleteId) => field.id(deleteId).remove());

    // Add a new subdocument if no _id provided.
    formData.forEach((data) => {
      if (data._id) {
        return;
      }

      field.push(data);
    });

    // Update existing subdocuments.
    formData.forEach((data) => {
      if (!data._id) {
        return;
      }

      const subdoc = field.id(data._id);

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

  updateSubDocuments(doc, values);
}

module.exports = { updateDocument };

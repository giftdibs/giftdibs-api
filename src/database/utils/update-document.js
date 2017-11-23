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
    field.forEach((subdoc) => {
      const found = formData.filter((data) => {
        return (subdoc._id.toString() === data._id);
      })[0];

      if (!found) {
        subdoc.remove();
      }
    });

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

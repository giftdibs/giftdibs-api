function updateDocument(document, fields, values) {
  const changes = {};

  fields.forEach(field => {
    if (values[field] !== undefined) {
      if (values[field] === null) {
        values[field] = undefined;
      }

      changes[field] = values[field];
    }
  });

  for (let key in changes) {
    document.set(key, changes[key]);
  }
}

module.exports = { updateDocument };

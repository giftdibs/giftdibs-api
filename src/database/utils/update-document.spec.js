const mock = require('mock-require');

describe('update document database util', () => {
  it('should only update certain fields', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const doc = {
      set() {}
    };
    const changes = { foo: 'bar' };
    const fields = [];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });

  it('should update a field', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const doc = {
      set() {}
    };
    const changes = { foo: 'bar' };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should handle undefined fields', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const doc = {
      set() {}
    };
    const changes = { foo: undefined };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });

  it('should clear a field if set to null', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const doc = {
      set() {}
    };
    const changes = { foo: null };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).toHaveBeenCalledWith('foo', undefined);
  });
});

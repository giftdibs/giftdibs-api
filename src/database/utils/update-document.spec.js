const mock = require('mock-require');

describe('Update document database util', () => {
  let doc;

  beforeEach(() => {
    doc = {
      set() {},
      toObject() { return this; }
    };
  });

  it('should only update certain fields', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { foo: 'bar' };
    const fields = [];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });

  it('should update a field', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { foo: 'bar' };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).toHaveBeenCalledWith('foo', 'bar');
  });

  it('should handle undefined fields', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { foo: undefined };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });

  it('should clear a field if set to null', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { foo: null };
    const fields = ['foo'];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).toHaveBeenCalledWith('foo', undefined);
  });

  it('should update existing subdocuments', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { children: [{ _id: '123', name: 'newname' }] };
    const fields = ['foo'];
    const subdoc = {
      _id: '123',
      remove() {},
      updateSync() {}
    };

    doc.children = [subdoc];
    doc.children.id = () => subdoc;
    const spy = spyOn(doc.children[0], 'updateSync');

    updateDocument(doc, fields, changes);
    expect(spy).toHaveBeenCalledWith({
      _id: '123',
      name: 'newname'
    });
  });

  it('should remove subdocuments that are not paired with form data', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { children: [
      { _id: 'efj' },
      { _id: '123' }
    ] };
    const fields = ['foo'];
    doc.children = [{
      _id: 'abc',
      remove() {}
    }, {
      _id: '123',
      remove() {}
    }];
    doc.children.id = () => {};
    spyOn(doc.children[0], 'remove');
    updateDocument(doc, fields, changes);
    expect(doc.children[0].remove).toHaveBeenCalledWith();
  });

  it('should add a new subdocument', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { children: [
      { name: 'abc' }
    ] };
    const fields = ['foo'];
    doc.children = [];
    doc.children.id = () => {};
    spyOn(doc.children, 'push');
    updateDocument(doc, fields, changes);
    expect(doc.children.push).toHaveBeenCalledWith({ name: 'abc' });
  });

  it('should not update subdocuments if not arrays', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { children: 'abc' };
    const fields = ['foo'];
    doc.children = [];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });

  it('should not update subdocuments if not mongoose documents', () => {
    const { updateDocument } = mock.reRequire('./update-document');
    const changes = { children: [] };
    const fields = ['foo'];
    doc.children = [];
    spyOn(doc, 'set');
    updateDocument(doc, fields, changes);
    expect(doc.set).not.toHaveBeenCalled();
  });
});

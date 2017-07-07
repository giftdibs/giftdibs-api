const logger = require('winston');
const mock = require('mock-require');

describe('database service', () => {
  let originalDatabaseUri = process.env.DATABASE_URI;

  afterEach(() => {
    process.env.DATABASE_URI = originalDatabaseUri;
    mock.stopAll();
  });

  it('should expose a connect method', () => {
    mock('mongoose', {
      connect: (uri) => Promise.resolve()
    });
    const db = mock.reRequire('./index');
    expect(typeof db.connect).toEqual('function');
  });

  it('should derive the connection string from process.env', (done) => {
    process.env.DATABASE_URI = 'uri';
    spyOn(logger, 'info').and.returnValue();
    mock('mongoose', {
      connect: (uri) => {
        expect(uri).toEqual('uri');
        return Promise.resolve();
      }
    });
    const db = mock.reRequire('./index');
    db.connect().then(() => done());
  });

  it('should log a message if the database successfully connects', (done) => {
    spyOn(logger, 'info').and.returnValue();
    mock('mongoose', {
      connect: () => Promise.resolve()
    });
    const db = mock.reRequire('./index');
    db.connect().then(() => {
      expect(logger.info).toHaveBeenCalled();
      done();
    });
  });

  it('should log an error if the database fails to connect', (done) => {
    spyOn(logger, 'error').and.returnValue();
    mock('mongoose', {
      connect: () => Promise.reject(new Error())
    });
    const db = mock.reRequire('./index');
    db.connect().then(() => {
      expect(logger.error).toHaveBeenCalled();
      done();
    });
  });
});

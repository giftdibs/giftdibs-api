const dotenv = require('dotenv');
const mock = require('mock-require');
const logger = require('winston');

describe('environment', () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it('should set env variables from a default config.env file', () => {
    spyOn(dotenv, 'config').and.returnValue({});
    mock.reRequire('./environment').applyEnvironment();
    expect(dotenv.config).toHaveBeenCalledWith({ path: 'config.env' });
  });

  it('should not set variables if environment is production', () => {
    process.env.NODE_ENV = 'production';
    spyOn(dotenv, 'config').and.returnValue({});
    mock.reRequire('./environment').applyEnvironment();
    expect(dotenv.config).not.toHaveBeenCalled();
  });

  it('should log a message if the config file is not found', () => {
    spyOn(logger, 'warn').and.returnValue();
    spyOn(dotenv, 'config').and.returnValue({
      error: new Error('not found'),
    });
    mock.reRequire('./environment').applyEnvironment();
    expect(logger.warn).toHaveBeenCalledWith(
      'Environment configuration could not be parsed from config.env.'
    );
  });
});

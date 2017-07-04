const dotenv = require('dotenv');

describe('environment', () => {
  it('should set env variables from a config.env file', () => {
    spyOn(dotenv, 'config').and.returnValue();
    require('./environment');
    expect(dotenv.config).toHaveBeenCalled();
  });
});

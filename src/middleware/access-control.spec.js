describe('access control middleware', () => {
  it('should set the access control header on the response', () => {
    const middleware = require('./access-control');
    const res = {
      setHeader: () => {}
    };
    spyOn(res, 'setHeader').and.returnValue();
    middleware(null, res, () => {});

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/x-www-form-urlencoded');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST,GET,PATCH,DELETE,OPTIONS');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key');
  });

  it('should execute the callback', () => {
    const middleware = require('./access-control');
    const res = {
      setHeader: () => {}
    };
    let called = false;
    const next = () => {
      called = true;
    };
    middleware(null, res, next);

    expect(called).toEqual(true);
  });
});

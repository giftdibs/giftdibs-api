describe('access control middleware', () => {
  it('should set the access control header on the response', () => {
    const middleware = require('./access-control');
    const res = {
      setHeader: () => {}
    };
    spyOn(res, 'setHeader').and.returnValue();
    middleware(null, res, () => {});

    expect(res.setHeader).toHaveBeenCalled();
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

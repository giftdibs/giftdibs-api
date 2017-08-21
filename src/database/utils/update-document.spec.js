// it('should only PATCH certain fields', (done) => {
//   spyOn(_req.user, 'set').and.callThrough();
//   const users = mock.reRequire('./users');
//   const updateUser = users.middleware.updateUser;
//   _req.body = { invalidField: 'foobar' };
//   updateUser[2](_req, {}, () => {
//     expect(_req.user.set).not.toHaveBeenCalled();
//     done();
//   });
// });

// it('should clear a field during PATCH if set to null', (done) => {
//   spyOn(_req.user, 'set').and.callThrough();
//   const users = mock.reRequire('./users');
//   const updateUser = users.middleware.updateUser;
//   _req.body = { firstName: null };
//   updateUser[2](_req, {}, () => {
//     expect(_req.user.set).toHaveBeenCalledWith('firstName', undefined);
//     done();
//   });
// });

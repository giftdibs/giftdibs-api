const authResponse = require('../../middleware/auth-response');

function searchUsers(req, res, next) {
  const searchText = decodeURIComponent(req.params.encodedSearchText);
  console.log('searchText?', searchText);

  authResponse({
    data: {
      results: []
    }
  })(req, res, next);
}

module.exports = {
  searchUsers
};

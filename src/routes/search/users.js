const { User } = require('../../database/models/user');

const authResponse = require('../../middleware/auth-response');

function escapeStringRegexp(str) {
  const matchOperatorsRegex = /[|\\{}()[\]^$+*?.]/g;

  return str.replace(matchOperatorsRegex, '\\$&');
}

function searchUsers(req, res, next) {
  const searchText = decodeURIComponent(req.params.encodedSearchText);
  const escapedSearchText = escapeStringRegexp(searchText);
  const regex = new RegExp(escapedSearchText, 'i');

  User
    .find({
      '$or': [
        { 'firstName': regex },
        { 'lastName': regex }
      ]
    })
    .limit(15)
    .select('firstName lastName _id')
    .lean()
    .then((docs) => {
      authResponse({
        data: {
          results: docs
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  searchUsers
};

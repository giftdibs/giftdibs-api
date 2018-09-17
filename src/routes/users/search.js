const { User } = require('../../database/models/user');

const authResponse = require('../../middleware/auth-response');

function escapeStringRegexp(str) {
  const matchOperatorsRegex = /[|\\{}()[\]^$+*?.]/g;

  return str.replace(matchOperatorsRegex, '\\$&');
}

function searchUsers(req, res, next) {
  const searchText = decodeURIComponent(req.query.search);
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
    .select('firstName lastName avatarUrl')
    .lean()
    .then((docs) => {
      const results = docs.map((user) => {
        user.id = user._id;
        delete user._id;
        return user;
      });
      authResponse({
        data: {
          results
        }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  searchUsers
};

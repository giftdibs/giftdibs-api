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

  // See: https://stackoverflow.com/a/37527020/6178885
  User.aggregate([
    {
      $project: {
        name: {
          $concat: ['$firstName', ' ', '$lastName'],
        },
        avatarUrl: '$avatarUrl',
      },
    },
    {
      $match: { name: { $regex: regex } },
    },
    {
      $limit: 10,
    },
  ])
    .then((docs) => {
      const results = docs.map((user) => {
        user.id = user._id;
        delete user._id;
        return user;
      });
      authResponse({
        data: {
          results,
        },
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  searchUsers,
};

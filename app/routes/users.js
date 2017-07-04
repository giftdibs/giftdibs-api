const passport = require('passport');
const User = require('../database/models/user');

// const createUser = (req, res, next) => {
//   let user = new User({
//     emailAddress: req.body.emailAddress,
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     dateCreated: new Date(),
//     dateUpdated: new Date()
//   });

//   user
//     .save()
//     .then(doc => res.json(doc._id))
//     .catch(next);
// };

const getUser = (req, res, next) => {
  User
    .find({ _id: req.params.id })
    .limit(1)
    .lean()
    .exec()
    .then(doc => res.json(doc[0]))
    .catch(next);
};

const getUsers = [
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    User
      .find({})
      .lean()
      .exec()
      .then(docs => res.json(docs))
      .catch(next);
  }
]

const updateUser = (req, res, next) => {
  let changes = req.body;
  changes.dateUpdated = new Date();

  User
    .update({ _id: req.params.id }, changes)
    .then(doc => res.json(doc._id))
    .catch(next);
};

const deleteUser = (req, res, next) => {
  User
    .remove({ _id: req.params.id })
    .then(() => res.json({ message: 'success' }))
    .catch(next);
};

module.exports = (router) => {
  router.route('/users')
    .get(getUsers);
    // .post(createUser);
  router.route('/users/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);
};

const User = require('../database/models/user');

const createUser = (req, res) => {
  let user = new User({
    emailAddress: req.body.emailAddress,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dateCreated: new Date(),
    dateUpdated: new Date()
  });

  user
    .save()
    .then(doc => res.json(doc._id))
    .catch(res.send);
};

const getUser = (req, res) => {
  User
    .find({ _id: req.params.id })
    .limit(1)
    .lean()
    .exec()
    .then(doc => res.json(doc[0]))
    .catch(res.send);
};

const getUsers = (req, res) => {
  User
    .find({})
    .lean()
    .exec()
    .then(docs => res.json(docs))
    .catch(res.send);
};

const updateUser = (req, res) => {
  let changes = req.body;
  changes.dateUpdated = new Date();

  User
    .update({ _id: req.params.id }, changes)
    .then(doc => res.json(doc._id))
    .catch(res.send);
};

const deleteUser = (req, res) => {
  User
    .remove({ _id: req.params.id })
    .then(() => res.json({ message: 'success' }))
    .catch(res.send);
};

module.exports = (router) => {
  router.route('/users')
    .get(getUsers)
    .post(createUser);
  router.route('/users/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);
};

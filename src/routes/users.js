const express = require('express');
const passport = require('passport');
const User = require('../database/models/user');
const confirmUserOwnership = require('../middleware/confirm-user-ownership');

function getSelectFields(req) {
  let selectFields;
  if (req.user._id.equals(req.params.id)) {
    selectFields = [
      'firstName',
      'lastName',
      'emailAddress',
      'emailAddressVerified'
    ].join(' ');
  } else {
    selectFields = [
      'firstName',
      'lastName',
      'emailAddressVerified'
    ].join(' ');
  }

  return selectFields;
}

const getUser = [
  (req, res, next) => {
    const selectFields = getSelectFields(req);

    User
      .find({ _id: req.params.id })
      .limit(1)
      .select(selectFields)
      .lean()
      .then(docs => {
        const user = docs[0];

        if (!user) {
          const err = new Error('User not found.');
          err.code = 200;
          err.status = 400;
          return Promise.reject(err);
        }

        res.json(user);
      })
      .catch(next);
  }
];

const getUsers = [
  (req, res, next) => {
    const selectFields = getSelectFields(req);

    User
      .find({})
      .select(selectFields)
      .lean()
      .then(docs => res.json(docs))
      .catch(next);
  }
]

const updateUser = [
  confirmUserOwnership,
  (req, res, next) => {
    let changes = {};
    const updateFields = [
      'firstName',
      'lastName',
      'emailAddress'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });

    // If the email address is being changed, need to re-verify.
    if (changes.emailAddress && (req.user.emailAddress !== req.body.emailAddress)) {
      req.user.resetEmailAddressVerification();
    }

    for (const key in changes) {
      req.user.set(key, changes[key]);
    }

    req.user
      .save()
      .then(() => res.json({ message: 'User updated.' }))
      .catch(err => {
        if (err.name === 'ValidationError') {
          err.code = 201;
          err.message = 'User update validation failed.';
        }

        next(err);
      });
  }
];

const deleteUser = [
  confirmUserOwnership,
  (req, res, next) => {
    User
      .remove({ _id: req.params.id })
      .then(() => res.json({ message: 'success' }))
      .catch(next);
  }
];

const router = express.Router();
router.use(passport.authenticate('jwt', { session: false }));
router.route('/users')
  .get(getUsers);
router.route('/users/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = {
  middleware: {
    getUser,
    getUsers,
    updateUser,
    deleteUser
  },
  router
};

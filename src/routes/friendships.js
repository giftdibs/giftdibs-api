const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { Friendship } = require('../database/models/friendship');
const { confirmUserOwnsFriendship } = require('../middleware/confirm-user-owns-friendship');
const { FriendshipValidationError } = require('../shared/errors');

function validateFriendRequest(req, res, next) {
  if (req.user._id.toString() === req.body._friend) {
    next(new FriendshipValidationError('You cannot follow yourself.'));
    return;
  }

  Friendship
    .find({
      _user: req.user._id,
      _friend: req.body._friend
    })
    .limit(1)
    .lean()
    .then((docs) => {
      const friend = docs[0];
      if (!friend) {
        next();
        return;
      }

      next(new FriendshipValidationError('You are already following that person.'));
    })
    .catch(next);
}

function handleError(err, next) {
  if (err.name === 'ValidationError') {
    const error = new FriendshipValidationError();
    error.errors = err.errors;
    next(error);
    return;
  }

  next(err);
}

const getFriendships = [
  (req, res, next) => {
    const query = {};
    const userId = req.query.userId;

    if (userId) {
      query.$or = [{
        _user: userId
      }, {
        _friend: userId
      }];
    }

    Friendship
      .find(query)
      .populate('_friend', 'firstName lastName')
      .populate('_user', 'firstName lastName')
      .lean()
      .then((friendships) => {
        authResponse({
          friendships
        })(req, res, next);
      })
      .catch(next);
  }
];

const createFriendship = [
  validateFriendRequest,

  (req, res, next) => {
    const friendship = new Friendship({
      _user: req.user._id,
      _friend: req.body._friend
    });

    friendship
      .save()
      .then((newFriendship) => {
        authResponse({
          friendshipId: newFriendship._id,
          message: 'Friendship successfully created.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const deleteFriendship = [
  confirmUserOwnsFriendship,

  (req, res, next) => {
    Friendship
      .remove({ _id: req.params.friendshipId })
      .then(() => {
        authResponse({
          message: 'Friendship successfully deleted.'
        })(req, res, next);
      })
      .catch(next);
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/friendships')
  .get(getFriendships)
  .post(createFriendship)
router.route('/friendships/:friendshipId')
  .delete(deleteFriendship);

module.exports = {
  middleware: {
    getFriendships,
    createFriendship,
    deleteFriendship
  },
  router
};

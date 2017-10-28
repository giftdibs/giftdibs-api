const express = require('express');
const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');
const { Friendship } = require('../database/models/friendship');
const { confirmUserOwnsFriendship } = require('../middleware/confirm-user-owns-friendship');
const { FriendshipValidationError } = require('../shared/errors');

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
    const wishListId = req.query.wishListId;

    if (wishListId) {
      query._wishList = wishListId;
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

const updateFriendship = [
  confirmUserOwnsFriendship,

  (req, res, next) => {
    Friendship
      .find({
        _id: req.params.friendshipId
      })
      .limit(1)
      .then((docs) => {
        const friendship = docs[0];
        friendship.update(req.body);
        return friendship.save();
      })
      .then(() => {
        authResponse({
          message: 'Friendship successfully updated.'
        })(req, res, next);
      })
      .catch((err) => handleError(err, next));
  }
];

const router = express.Router();
router.use(authenticateJwt);
router.route('/friendships')
  .get(getFriendships)
  .post(createFriendship)
router.route('/friendships/:friendshipId')
  .delete(deleteFriendship)
  .patch(updateFriendship);

module.exports = {
  middleware: {},
  router
};

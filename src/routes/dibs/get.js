const authResponse = require('../../middleware/auth-response');

const {
  DibValidationError
} = require('../../shared/errors');

const { Gift } = require('../../database/models/gift');
const { Dib } = require('../../database/models/dib');

// TODO: Make sure user has permission to retrieve dibs from this wish list,
// once we've established wish list privacy.
function getDibs(req, res, next) {
  if (!req.query.wishListId) {
    next(
      new DibValidationError('Please provide a wish list ID.')
    );

    return;
  }

  // User wishes to retrieve all dibs for a given wish list.
  // (If the user owns the wish list, do not retrieve any dib information!)

  // Get all gifts in a wish list, not owned by current user.
  // (we don't want to retrieve dibs for current user)
  Gift
    .find({
      _wishList: req.query.wishListId,
      _user: { $ne: req.user._id }
    })
    .lean()
    .then((gifts) => {
      const giftIds = gifts.map((gift) => gift._id);

      return Dib
        .find({})
        .where('_gift')
        .in(giftIds)
        .populate('_user', 'firstName lastName')
        .lean();
    })
    .then((dibs) => {
      authResponse({
        data: { dibs }
      })(req, res, next);
    })
    .catch(next);
}

module.exports = {
  getDibs
};

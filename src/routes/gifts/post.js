const authResponse = require('../../middleware/auth-response');

const {
  Gift
} = require('../../database/models/gift');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  GiftValidationError
} = require('../../shared/errors');

const {
  handleError
} = require('./shared');

async function createGift(req, res, next) {
  const userId = req.user._id;
  const wishListId = req.params.wishListId;

  if (!wishListId) {
    next(
      new GiftValidationError(
        'Please provide a wish list ID.'
      )
    );
    return;
  }

  try {
    const wishList = await WishList.confirmUserOwnership(
      wishListId,
      userId
    );

    const gift = new Gift({
      _user: userId,
      _wishList: wishListId,
      name: req.body.name,
      notes: req.body.notes,
      priority: req.body.priority,
      budget: req.body.budget,
      quantity: req.body.quantity
    });

    if (req.body.externalUrls) {
      req.body.externalUrls.forEach((externalUrl) => {
        if (!externalUrl.url || !externalUrl.url.trim()) {
          return;
        }

        gift.externalUrls.push({
          url: externalUrl.url
        });
      });
    }

    const doc = await gift.save();

    await wishList.save();

    authResponse({
      data: { giftId: doc._id },
      message: 'Gift successfully created.'
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  createGift
};

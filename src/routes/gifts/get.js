const authResponse = require('../../middleware/auth-response');

const {
  formatGiftResponse
} = require('./shared');

const {
  Gift
} = require('../../database/models/gift');

const {
  WishList
} = require('../../database/models/wish-list');

const {
  GiftNotFoundError,
  WishListNotFoundError
} = require('../../shared/errors');

async function getGift(req, res, next) {
  const giftId = req.params.giftId.toString();
  const userId = req.user._id.toString();

  try {
    const gifts = await Gift.find({
      _id: giftId
    })
      .limit(1)
      .select([
        '_user',
        '_wishList',
        'budget',
        'comments',
        'dateCreated',
        'dateReceived',
        'dateUpdated',
        'dibs',
        'externalUrls',
        'imageUrl',
        'name',
        'notes',
        'priority',
        'quantity'
      ].join(' '))
      .populate('_user', 'avatarUrl firstName lastName')
      .populate('_wishList', 'name')
      .populate('comments._user', 'avatarUrl firstName lastName')
      .populate('dibs._user', 'avatarUrl firstName lastName')
      .lean();

    const gift = gifts[0];

    if (!gift) {
      next(new GiftNotFoundError())
      return;
    }

    const wishListId = gift._wishList;

    const wishLists = await WishList.findAuthorized(userId, {
      _id: wishListId
    })
      .limit(1)
      .select('name type')
      .lean();

    const wishList = wishLists[0];
    if (!wishList) {
      next(new WishListNotFoundError());
      return;
    }

    const formatted = formatGiftResponse(gift, wishList, userId);

    authResponse({
      data: { gift: formatted }
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function getGifts(req, res, next) {
  const userId = req.user._id.toString();
  const start = parseInt(req.query.startIndex) || 0;
  const max = 36;

  try {
    const query = await WishList.getAuthorizedFriendsQuery(userId);
    const wishLists = await WishList.find(query)
      .select('_id')
      .lean();

    const wishListIds = wishLists.map((wl) => wl._id);

    // TODO: Figure out a better way to do pagination (skip does not scale):
    // https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
    const gifts = await Gift.find({
      '_wishList': {
        $in: wishListIds
      },
      dateReceived: { $exists: false },
      $or: [
        {
          quantity: 1,
          'dibs.dateDelivered': { $exists: false }
        },
        {
          // Always show multiple dibbed gifts.
          // TODO: Figure out how to filter out multi-dib delivered gifts.
          quantity: { $gt: 1 }
        }
      ]
    })
      .skip(start)
      .limit(max)
      .select([
        '_user',
        '_wishList',
        'dateReceived',
        'dateUpdated',
        'dibs._id',
        'dibs._user',
        'dibs.dateDelivered',
        'dibs.quantity',
        'budget',
        'imageUrl',
        'name',
        'priority',
        'quantity'
      ].join(' '))
      .populate('_user', 'avatarUrl firstName lastName')
      .populate('_wishList', 'name')
      .populate('dibs._user', 'firstName lastName')
      .sort('-dateUpdated')
      .lean();

    const formatted = gifts.map((g) => {
      return formatGiftResponse(g, g._wishList, userId);
    });

    authResponse({
      data: { gifts: formatted }
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGift,
  getGifts
};

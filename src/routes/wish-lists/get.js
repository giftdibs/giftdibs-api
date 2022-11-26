const authResponse = require('../../middleware/auth-response');

const { Gift } = require('../../database/models/gift');

const { WishList } = require('../../database/models/wish-list');

const { WishListNotFoundError } = require('../../shared/errors');

const { formatWishListResponse } = require('./shared');

async function getWishList(req, res, next) {
  const userId = req.user._id;
  const wishListId = req.params.wishListId;
  const sortBy = req.query.sortBy;

  let sortKey;
  switch (sortBy) {
    case 'recent':
    default:
      sortKey = '-dateUpdated';
      break;
    case 'priority':
      sortKey = '-priority';
      break;
  }

  try {
    const wishLists = await WishList.findAuthorized(userId, {
      _id: wishListId,
    })
      .limit(1)
      .select('_user dateCreated dateUpdated isArchived name privacy type')
      .populate('_user', 'avatarUrl firstName lastName')
      .lean();

    const wishList = wishLists[0];

    if (!wishList) {
      next(new WishListNotFoundError());
      return;
    }

    const gifts = await Gift.find({
      _wishList: wishListId,
    })
      .select(
        [
          'budget',
          'dateCreated',
          'dateReceived',
          'dateUpdated',
          'dibs._id',
          'dibs._user',
          'dibs.dateDelivered',
          'dibs.dateUpdated',
          'dibs.isAnonymous',
          'dibs.quantity',
          'imageUrl',
          'name',
          'priority',
          'quantity',
        ].join(' ')
      )
      .populate('_user', 'avatarUrl firstName lastName')
      .populate('dibs._user', 'avatarUrl firstName lastName')
      .sort(sortKey)
      .lean();

    wishList.gifts = gifts;

    const formatted = formatWishListResponse(wishList, userId);

    authResponse({
      data: { wishList: formatted },
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function getWishLists(req, res, next) {
  const userId = req.user._id;
  const start = parseInt(req.query.startIndex) || 0;
  const max = 12;
  const getArchived = req.query.archived === true;

  let query;
  if (getArchived) {
    query = {
      isArchived: true,
    };
  } else {
    query = {
      $or: [
        {
          isArchived: { $exists: false },
        },
        {
          isArchived: false,
        },
      ],
    };
  }

  if (req.params.userId) {
    query._user = req.params.userId;
  }

  try {
    // TODO: Figure out a better way to do pagination (skip does not scale):
    // https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
    const wishLists = await WishList.findAuthorized(userId, query)
      .skip(start)
      .limit(max)
      .select('_user name dateUpdated privacy type')
      .sort('-dateUpdated')
      .populate('_user', 'avatarUrl firstName lastName')
      .lean();

    const wishListIds = wishLists.map((wl) => wl._id);

    const gifts = await Gift.find({
      _wishList: {
        $in: wishListIds,
      },
    })
      .select('_wishList dateCreated dateUpdated imageUrl name')
      .sort('-dateUpdated')
      .lean();

    wishLists.forEach((wishList) => {
      wishList.gifts = [];
      gifts.forEach((gift) => {
        if (gift._wishList.toString() === wishList._id.toString()) {
          wishList.gifts.push(gift);
        }
      });
    });

    const formatted = wishLists.map((wishList) => {
      return formatWishListResponse(wishList, userId);
    });

    authResponse({
      data: { wishLists: formatted },
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

function getArchivedWishLists(req, res, next) {
  req.query.archived = true;
  getWishLists(req, res, next);
}

module.exports = {
  getArchivedWishLists,
  getWishList,
  getWishLists,
};

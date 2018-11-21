// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const db = require('../src/database');

// const {
//   Gift
// } = require('../src/database/models/gift');

// const {
//   WishList
// } = require('../src/database/models/wish-list');

// async function migrate() {
//   await db.connect();

//   const wishLists = await WishList.find({})
//     .select(
//       [
//         'gifts.budget',
//         'gifts.comments._user',
//         'gifts.comments.body',
//         'gifts.comments.dateCreated',
//         'gifts.comments.dateUpdated',
//         'gifts.dateCreated',
//         'gifts.dateReceived',
//         'gifts.dateUpdated',
//         'gifts.dibs._user',
//         'gifts.dibs.dateCreated',
//         'gifts.dibs.dateDelivered',
//         'gifts.dibs.dateUpdated',
//         'gifts.dibs.isAnonymous',
//         'gifts.dibs.notes',
//         'gifts.dibs.pricePaid',
//         'gifts.dibs.quantity',
//         'gifts.externalUrls.url',
//         'gifts.imageUrl',
//         'gifts.name',
//         'gifts.notes',
//         'gifts.quantity',
//         'gifts.priority'
//       ].join(' ')
//     ).lean();

//   const promises = [];
//   wishLists.forEach((wishList) => {
//     if (wishList.gifts) {
//       wishList.gifts.forEach((gift) => {
//         const newGift = new Gift(gift);
//         newGift.set('_user', wishList._user);
//         newGift.set('_wishList', wishList._id);
//         promises.push(newGift.save());
//       });
//     }
//   });

//   const wishListDocs = await WishList.find({});

//   return Promise.all(promises)
//     .then(() => {
//       return Promise.all(wishListDocs.map((wishList) => {
//         // wishList.gifts = undefined;
//         // return wishList.save();
//       }));
//     });
// }

// migrate()
//   .then(() => {
//     console.log('DONE');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.log('ERROR:', err);
//     process.exit(1);
//   });

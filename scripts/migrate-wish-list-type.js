// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const db = require('../src/database');
// const { WishList } = require('../src/database/models/wish-list');

// async function migrate() {
//   await db.connect();

//   const wishLists = await WishList.find({}).select('wishListType');

//   const promises = wishLists.map(async (wishList) => {
//     wishList.set('type', wishList.wishListType.type);
//     wishList.wishListType = undefined;
//     return wishList.save();
//   });

//   return Promise.all(promises);
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

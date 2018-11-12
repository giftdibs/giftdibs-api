// const mysql = require('mysql');
// const request = require('request-promise');
// const randomstring = require('randomstring');

// let failedRequests = 0;

// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const db = require('../src/database');

// const { Friendship } = require('../src/database/models/friendship');
// const { User } = require('../src/database/models/user');
// const { WishList } = require('../src/database/models/wish-list');

// const fileHandler = require('../src/shared/file-handler');
// const credentials = {
//   host: env.get('MYSQL_HOST'),
//   port: env.get('MYSQL_PORT'),
//   user: env.get('MYSQL_USER'),
//   password: env.get('MYSQL_PASSWORD'),
//   database: env.get('MYSQL_DATABASE')
// };

// const connection = mysql.createConnection(credentials);

// // Matches legacy MySQL IDs to new MongoDB IDs.
// const DB_MAP = {
//   gifts: {},
//   users: {},
//   wishLists: {}
// };

// connection.connect();

// const interval = setInterval(() => {
//   connection.query('SELECT 1');
//   console.log('.');
// }, 5000);

// function getUsers() {
//   return mysqlQuery([
//     'SELECT u.dateLastLoggedIn, u.emailAddress, u.emailConfirmed, u.facebookUserId, u.firstName, u.interests, u.lastName, u.userId, i.name AS imageName',
//     'FROM User u LEFT JOIN Image i',
//     'ON u.imageId = i.imageId'
//   ].join(' '));
// }

// function getFriendships() {
//   return mysqlQuery([
//     'SELECT * FROM Follow'
//   ].join(' '));
// }

// function getPrivacyUsersByWishListId(wishListId) {
//   return mysqlQuery([
//     'SELECT * FROM WishList_User',
//     `WHERE wishListId = ${wishListId}`
//   ].join(' '));
// }

// function getWishLists() {
//   return mysqlQuery([
//     'SELECT * from WishList'
//   ].join(' '));
// }

// function getGiftsByWishListId(wishListId) {
//   return mysqlQuery([
//     'SELECT g.giftId, g.userId, g.wishListId, g.priorityId, g.name, g.notes, g.url, g.price, g.quantity, g.isReceived, g.dateCreated, g.dateReceived, g.timestamp, i.name AS imageName',
//     'FROM Gift g',
//     'LEFT JOIN Image i ON g.imageId = i.imageId',
//     `WHERE g.wishListId = ${wishListId}`
//   ].join(' '));
// }

// function getDibs() {
//   return mysqlQuery([
//     'SELECT * from Dib'
//   ].join(' '));
// }

// function getComments() {
//   return mysqlQuery([
//     'SELECT * from Comment'
//   ].join(' '));
// }

// function mysqlQuery(query) {
//   return new Promise((resolve, reject) => {
//     connection.query(query, (error, results) => {
//       if (error) {
//         reject(error);
//         return;
//       }

//       resolve(results);
//     });
//   });
// }

// function settle(promise) {
//   return promise.then((result) => {
//     return {
//       result,
//       status: 'fulfilled'
//     }
//   }, (error) => {
//     return {
//       error,
//       status: 'rejected'
//     };
//   });
// }

// async function getRemoteImage(url, tries = 0) {
//   let imageBuffer;
//   try {
//     imageBuffer = await request({
//       method: 'GET',
//       uri: url,
//       timeout: 600000, // 10 min.
//       // headers: {
//       //   'Connection': 'keep-alive'
//       // },

//       // Setting encoding to null will cause request to
//       // output a buffer instead of a string.
//       // See: https://stackoverflow.com/a/18265122/6178885
//       encoding: null
//     });
//   } catch (err) {
//     if (tries > 3) {
//       console.log('NUMBER OF RETRIES MET :(', url);
//       return {};
//     }

//     if (err.message.indexOf('ECONNRESET') > -1 || err.message.indexOf('ETIMEDOUT') > -1) {
//       console.log('RETRY');
//       return getRemoteImage(url, tries++);
//     } else {
//       failedRequests++;
//       console.log('IMAGE NOT FOUND:', url);
//     }
//   }

//   const file = {
//     buffer: imageBuffer,
//     mimetype: 'image/jpeg'
//   };

//   return file;
// }

// async function migrateUsers() {
//   const userResults = await getUsers();

//   const userPromises = userResults.map(async (result) => {
//     const user = new User({
//       dateLastLoggedIn: result.dateLastLoggedIn,
//       emailAddress: result.emailAddress,
//       emailAddressVerified: (result.emailConfirmed === 1),
//       facebookId: result.facebookUserId,
//       firstName: result.firstName,
//       interests: result.interests,
//       lastName: result.lastName
//     });

//     DB_MAP.users[result.userId] = user._id;

//     if (result.imageName) {
//       const oldImageUrl = `http://localhost:8888/public_html/uploads/user/${result.imageName}-original.jpg`;
//       const file = await getRemoteImage(oldImageUrl);
//       if (file.buffer) {
//         const fileName = user._id + '-' + randomstring.generate();
//         const imageUrl = await fileHandler.upload(file, fileName);
//         user.avatarUrl = imageUrl;
//       }
//     }

//     return settle(user.save()).then((r) => {
//       if (r.status === 'rejected') {
//         console.log('FAILED USER:', r.error.message, result);
//       }

//       return r;
//     });
//   });

//   return Promise.all(userPromises);
// }

// async function migrateFriendships() {
//   const followResults = await getFriendships();

//   const friendshipPromises = followResults.map((followResult) => {
//     const friendship = new Friendship({
//       _user: DB_MAP.users[followResult.userId],
//       _friend: DB_MAP.users[followResult.leaderId]
//     });

//     return friendship.save();
//   });

//   return Promise.all(friendshipPromises);
// }

// async function migrateWishLists() {
//   const wishListResults = await getWishLists();
//   const dibResults = await getDibs();
//   const commentResults = await getComments();

//   const wishListPromises = await wishListResults.map(async (wishListResult) => {
//     const wishList = new WishList({
//       _user: DB_MAP.users[wishListResult.userId],
//       name: wishListResult.name,
//       description: wishListResult.description,
//       dateCreated: wishListResult.dateCreated,
//       wishListType: (wishListResult.isRegistry === 1) ? 'registry' : 'wish-list'
//     });

//     DB_MAP.wishLists[wishListResult.wishListId] = wishList._id;

//     const privacy = {};
//     switch (wishListResult.privacyId) {
//       default:
//       case 1: // Everyone
//       case 3: // Just My Followers
//         privacy.type = 'everyone';
//         break;
//       case 2: // Just Me
//         privacy.type = 'me';
//         break;
//       case 4: // Custom
//         privacy.type = 'custom';
//         break;
//     }

//     if (privacy.type === 'custom') {
//       const privacyUsers = await getPrivacyUsersByWishListId(
//         wishListResult.wishListId
//       );

//       if (privacyUsers.length) {
//         privacy._allow = privacyUsers.map((privacyUser) => {
//           return DB_MAP.users[privacyUser.userId];
//         });
//       } else {
//         privacy.type = 'me';
//       }
//     }

//     wishList.privacy = privacy;

//     // Gifts.
//     const giftResults = await getGiftsByWishListId(wishListResult.wishListId);

//     const giftPromises = await giftResults.map(async (giftResult) => {
//       const gift = wishList.gifts.create({
//         budget: `${giftResult.price}`.slice(0, -2) * 1,
//         dateCreated: giftResult.dateCreated,
//         name: giftResult.name.replace(/\\'/g, `'`),
//         notes: giftResult.notes,
//         priority: giftResult.priorityId,
//         quantity: giftResult.quantity
//       });

//       if (giftResult.url) {
//         gift.set('externalUrls', [{
//           url: giftResult.url
//         }]);
//       }

//       if (
//         giftResult.dateReceived &&
//         giftResult.dateReceived.getMonth
//       ) {
//         gift.set('dateReceived', giftResult.dateReceived);
//       }

//       if (giftResult.imageName) {
//         const oldImageUrl = `http://localhost:8888/public_html/uploads/gift/${giftResult.imageName}-original.jpg`;
//         const file = await getRemoteImage(oldImageUrl);

//         if (file.buffer) {
//           const fileName = wishList._user + '-' + randomstring.generate();
//           const imageUrl = await fileHandler.upload(file, fileName);

//           gift.imageUrl = imageUrl;
//         }
//       }

//       DB_MAP.gifts[giftResult.giftId] = gift._id;

//       wishList.gifts.push(gift);

//       return Promise.resolve();
//     });

//     return Promise.all(giftPromises).then(() => {
//       return wishList;
//     });
//   });

//   const wishLists = await Promise.all(wishListPromises);

//   wishLists.forEach((wishList) => {
//     // Dibs.
//     dibResults.forEach((dibResult) => {
//       const userId = DB_MAP.users[dibResult.userId];
//       const giftId = DB_MAP.gifts[dibResult.giftId];
//       const gift = wishList.gifts.id(giftId);

//       if (!gift) {
//         return;
//       }

//       const dib = gift.dibs.create({
//         _user: userId,
//         dateCreated: dibResult.dateCreated,
//         isAnonymous: (dibResult.isPrivate === 1),
//         quantity: dibResult.quantity
//       });

//       // Dib delivered.
//       if (dibResult.dibStatusId === 4) {
//         if (
//           dibResult.dateDelivered &&
//           dibResult.dateDelivered.getMonth
//         ) {
//           dib.set('dateDelivered', dibResult.dateDelivered);
//         } else {
//           dib.set('dateDelivered', new Date())
//         }
//       }

//       if (dibResult.pricePaid) {
//         dib.set('pricePaid', `${dibResult.pricePaid}`.slice(0, -2) * 1);
//       }

//       gift.dibs.push(dib);
//     });

//     // Comments
//     commentResults.forEach((commentResult) => {
//       const userId = DB_MAP.users[commentResult.userId];
//       const giftId = DB_MAP.gifts[commentResult.giftId];
//       const gift = wishList.gifts.id(giftId);

//       if (!gift) {
//         return;
//       }

//       const comment = gift.comments.create({
//         _user: userId,
//         dateCreated: commentResult.dateCreated,
//         body: commentResult.content
//       });

//       gift.comments.push(comment);
//     });
//   });

//   return Promise.all(wishLists.map((wishList) => {
//     return settle(wishList.save()).then((r) => {
//       if (r.status === 'rejected') {
//         console.log('FAILED WISH LIST:', r.error.message, wishList);
//       }

//       return r;
//     });
//   }));
// }

// function exit() {
//   clearInterval(interval);
//   connection.end();
//   db.disconnect();
//   process.exit();
// }

// async function migrate() {
//   try {
//     await db.connect();

//     await User.remove({});
//     await Friendship.remove({});
//     await WishList.remove({});

//     await migrateUsers();
//     await migrateFriendships();
//     await migrateWishLists();

//     console.log('Done.');
//     console.log('Total failed requests:', failedRequests);
//     exit();
//   } catch (err) {
//     console.log('ERROR!', err);
//     exit();
//   }
// }

// migrate();

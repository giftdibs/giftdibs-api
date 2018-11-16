// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const db = require('../src/database');

// const mailer = require('../src/shared/mailer');

// async function migrate() {
//   await db.connect();

//   const { User } = require('../src/database/models/user');

//   const users = await User.find({})
//     .select('emailAddress firstName lastName')
//     .lean();

//   const promises = users.map(async (user) => {
//     await mailer.addUserToMailingList({
//       id: user._id.toString(),
//       emailAddress: user.emailAddress,
//       firstName: user.firstName,
//       lastName: user.lastName
//     });
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

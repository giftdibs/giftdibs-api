// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const db = require('../src/database');

// const mailer = require('../src/shared/mailer');

// async function migrate() {
//   await db.connect();

//   const { User } = require('../src/database/models/user');

//   const users = await User.find({}).lean();

//   const promises = users.map(async (user) => {
//     return mailer.addUserToMailingList({
//       emailAddress: user.emailAddress,
//       firstName: user.lastName,
//       lastName: user.firstName
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

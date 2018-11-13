const env = require('../src/shared/environment');
env.applyEnvironment();

const mailer = require('../src/shared/mailer');

function create() {
  return mailer.addUserToMailingList({
    emailAddress: 'stevo.brush@gmail.com',
    firstName: 'Steve',
    lastName: 'Brush',
    id: '123456'
  });
}

create()
  .then(() => {
    console.log('DONE');
    process.exit(0);
  })
  .catch((err) => {
    console.log('ERROR:', err);
    process.exit(1);
  });

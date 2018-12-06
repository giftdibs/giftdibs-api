const env = require('../src/shared/environment');
env.applyEnvironment();

const mailer = require('../src/shared/mailer');

function sendEmail() {
  const subject = 'Christmas is right around the corner!';
  const html = `
    <p>
      Hi, %recipient_fname%!
    </p>

    <p>
      It's not too late to <a href="https://giftdibs.com/profile?action=new_wish_list">create a new Christmas wish list</a>, or to find something a friend or family member really wants.
    </p>

    <p>
      <strong>Did you know</strong> you can edit your dibs with notes and keep track of what you paid for each item? This feature is especially useful if you have a strict Christmas budget! :-)
    </p>

    <p>
      If you have any concerns or need assistance, please <a href="https://giftdibs.com/support/feedback">contact us</a>.
    </p>

    <p>
      Happy dibbing!
    </p>`;

  return mailer.sendUpdateEmail(subject, html);
}

sendEmail()
  .then(() => {
    console.log('DONE');
    process.exit(0);
  })
  .catch((err) => {
    console.log('ERROR:', err);
    process.exit(1);
  });

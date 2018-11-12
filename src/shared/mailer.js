const env = require('../shared/environment');

const apiKey = env.get('MAILGUN_API_KEY');
const domain = env.get('MAILGUN_DOMAIN');
const mailgun = require('mailgun-js')({
  apiKey,
  domain
});

function sendMessage(to, subject, html) {
  const data = {
    from: `GiftDibs <${env.get('NO_REPLY_EMAIL_ADDRESS')}>`,
    to,
    subject,
    html
  };

  return new Promise((resolve, reject) => {
    mailgun.messages().send(data, (error, body) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(body);
    });
  });
}

function sendPasswordResetEmail(emailAddress, resetPasswordToken) {
  const href = `${env.get('RESET_PASSWORD_URL')}/${resetPasswordToken}`;

  console.log('RESET EMAIL:', href);

  return sendMessage(
    emailAddress,
    'Reset password request',
    [
      'Please click the link below to reset your password.<br>',
      `<a href="${href}">${href}</a>`
    ].join('')
  );
}

function sendAccountVerificationEmail(
  emailAddress,
  emailAddressVerificationToken
) {
  const href = `${env.get('VERIFY_ACCOUNT_URL')}/${emailAddressVerificationToken}`;

  console.log('VERIFY ACCOUNT:', href);

  return sendMessage(
    emailAddress,
    'Verify account',
    `
Please click the link below to verify your GiftDibs account.<br>
<a href="${href}">${href}</a>`
  );
}

function sendFeedbackEmail(reason, body, referrer) {
  return sendMessage(
    env.get('ADMIN_EMAIL_ADDRESS'),
    'Feedback submitted',
    [
      `Reason: ${reason}<br>`,
      `Referrer: ${referrer}<br><br>`,
      `${body}`
    ].join('')
  );
}

function addUserToMailingList(user) {
  if (env.get('NODE_ENV') === 'development') {
    Promise.resolve();
    return;
  }

  const list = mailgun.lists(env.get('MAILGUN_MAILING_LIST_UPDATES'));

  const member = {
    subscribed: true,
    address: user.emailAddress,
    name: user.firstName + ' ' + user.lastName
  };

  return new Promise((resolve, reject) => {
    mailgun.validate(member.address, true, (validateErr, body) => {
      let isValid = false;
      if (validateErr) {
        console.log('Mailgun validation error:', validateErr);
        // Go ahead and add the email to the mailing list,
        // even if validation rate limits have been reached.
        isValid = true;
      }

      if (isValid || (body && body.is_valid)) {
        list.members().create(member, (createErr, data) => {
          if (createErr) {
            reject(createErr);
            return;
          }

          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  addUserToMailingList,
  sendAccountVerificationEmail,
  sendFeedbackEmail,
  sendPasswordResetEmail
};

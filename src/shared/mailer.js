const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun = require('mailgun-js')({
  apiKey,
  domain
});

function sendMessage(to, subject, html) {
  const data = {
    from: 'GiftDibs <noreply@mg.giftdibs.com>',
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

function sendPasswordResetEmail(
  emailAddress,
  resetPasswordToken
) {
  const href = `http://localhost:4200/account/reset-password/${resetPasswordToken}`;

  return sendMessage(
    emailAddress,
    'Reset password request',
    [
      'Click the link below to reset your password:<br>',
      `<a href="${href}">${href}</a>`
    ].join('')
  );
}

function sendAccountVerificationEmail(
  emailAddress,
  emailAddressVerificationToken
) {
  const href = `http://localhost:4200/account/verify/${emailAddressVerificationToken}`;

  return sendMessage(
    emailAddress,
    'Verify account',
    `
Click the link below to verify your account:<br>
<a href="${href}">${href}</a>`
  );
}

module.exports = {
  sendAccountVerificationEmail,
  sendPasswordResetEmail
};

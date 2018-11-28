const env = require('../shared/environment');

const apiKey = env.get('MAILGUN_API_KEY');
const domain = env.get('MAILGUN_DOMAIN');
const mailgun = require('mailgun-js')({
  apiKey,
  domain
});

function getHtmlTemplate(contents, showUnsubscribe = false) {
  const unsubscribe = (showUnsubscribe) ? `<a style="color:#888;" href="%mailing_list_unsubscribe_url%">Unsubscribe</a><br>` : '';

  /* eslint-disable max-len */
  return `
<table style="width:100%;height:100%;background-color:#fafafa;border-collapse:collapse;">
<tr>
<td style="padding:12px;">
  <table style="width:100%;border:1px solid #ebebeb;background-color:#fff;">
  <tr>
  <td style="padding:12px;border-bottom:1px solid #ebebeb">
    <table style="width:100%;border:0;">
    <tr>
    <td style="height: 40px;">
    <a style="width:40px;height:40px;display:block;overflow:hidden;" href="https://giftdibs.com">
      <img style="display: block; width: 100%; height: auto; border: 0;" src="https://giftdibs.com/assets/gd-logo.png" />
    </a>
    </td>
    </tr>
    </table>
  </td>
  </tr>
  <tr>
  <td style="padding:12px;">
    ${contents}
  </td>
  </tr>
  </table>
  <p style="font-size:11px;color:#888;line-height:1;text-align:center;">
    &copy; GiftDibs, LLC<br>
    You are receiving this email because your current notification settings indicate that you wish to be notified in this way.<br>You can change your notification settings at <a style="color:#888;" href="https://giftdibs.com/account/settings">giftdibs.com</a>.<br>
    ${unsubscribe}
    <a style="color:#888;" href="https://giftdibs.com/support/privacy">Privacy</a>
  </p>
</td>
</tr>
</table>`;
  /* eslint-enable */
}

function sendEmail(to, subject, html, showUnsubscribe) {
  const data = {
    from: `GiftDibs <${env.get('NO_REPLY_EMAIL_ADDRESS')}>`,
    to,
    subject,
    html: getHtmlTemplate(html, showUnsubscribe)
  };

  return new Promise((resolve, reject) => {
    mailgun.messages().send(data, (error, body) => {
      if (error) {
        console.log('[MAILGUN ERROR]', error);
        // Swallow mailgun errors.
        resolve();
        return;
      }

      resolve(body);
    });
  });
}

function sendPasswordResetEmail(emailAddress, resetPasswordToken) {
  const href = `${env.get('RESET_PASSWORD_URL')}/${resetPasswordToken}`;

  console.log('RESET EMAIL:', href);

  return sendEmail(
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

  return sendEmail(
    emailAddress,
    'Verify account',
    `
Please click the link below to verify your GiftDibs account.<br>
<a href="${href}">${href}</a>`
  );
}

function sendFeedbackEmail(reason, body, referrer) {
  return sendEmail(
    env.get('ADMIN_EMAIL_ADDRESS'),
    'Feedback submitted',
    [
      `Reason: ${reason}<br>`,
      `Referrer: ${referrer}<br><br>`,
      `${body}`
    ].join('')
  );
}

async function addUserToMailingList(user) {
  const isDevelopment = (env.get('NODE_ENV') === 'development');
  const list = mailgun.lists(env.get('MAILGUN_MAILING_LIST_UPDATES'));

  const member = {
    subscribed: true,
    address: user.emailAddress,
    name: user.firstName + ' ' + user.lastName,
    vars: {
      userId: user.id
    }
  };

  let isValid = false;
  let validateResult;

  if (!isDevelopment) {
    try {
      validateResult = await mailgun.validate(member.address, true);
    } catch (err) {
      console.log('Mailgun validation error:', err);
      // Go ahead and add the email to the mailing list,
      // even if validation rate limits have been reached.
      isValid = true;
    }
  } else {
    isValid = true;
  }

  return new Promise((resolve, reject) => {
    if (isValid || (validateResult && validateResult.is_valid)) {
      list.members().create(member, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    } else {
      resolve();
    }
  });
}

function sendUpdateEmail(subject, html) {
  const to = env.get('MAILGUN_MAILING_LIST_UPDATES');

  return sendEmail(to, subject, html, true);
}

module.exports = {
  addUserToMailingList,
  sendAccountVerificationEmail,
  sendEmail,
  sendFeedbackEmail,
  sendPasswordResetEmail,
  sendUpdateEmail
};

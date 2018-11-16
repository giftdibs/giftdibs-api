// const env = require('../src/shared/environment');
// env.applyEnvironment();

// const mailer = require('../src/shared/mailer');

// function sendEmail() {
//   const subject = 'Black Friday: Are you ready?';
//   const html = `
// <table style="width:100%;height:100%;background-color:#fafafa;border-collapse:collapse;">
// <tr>
// <td style="padding:12px;">
//   <table style="width:100%;border:1px solid #ebebeb;background-color:#fff;">
//   <tr>
//   <td style="padding:12px;border-bottom:1px solid #ebebeb">
//     <table style="width:100%;border:0;">
//     <tr>
//     <td style="height: 40px;">
//     <a style="width:40px;height:40px;display:block;overflow:hidden;" href="https://giftdibs.com">
//       <img style="display: block; width: 100%; height: auto; border: 0;" src="https://giftdibs.com/assets/gd-logo.png" />
//     </a>
//     </td>
//     </tr>
//     </table>
//   </td>
//   </tr>
//   <tr>
//   <td style="padding:12px;">
//     <p>
//       Hi, %recipient_fname%!
//     </p>

//     <p>
//       Black Friday is right around the corner, kicking off the holiday shopping season. Now might be the perfect time to create a new wish list, if you haven't done so already!
//     </p>

//     <p>
//       <a style="display:inline-block;padding:10px 15px;background-color:#329b22;color:#fff;text-decoration:none;border-radius:5px;font-size:18px;" href="https://giftdibs.com">Create wish list</a>
//     </p>

//     <p>
//       Happy dibbing!
//     </p>

//     <p style="font-size:12px;color:#888;">
//       &copy; GiftDibs, LLC<br>
//       <a style="color:#888;" href="%mailing_list_unsubscribe_url%">Unsubscribe</a><br>
//       <a style="color:#888;" href="https://giftdibs.com/support/privacy">Privacy</a>
//     </p>
//   </td>
//   </tr>
//   </table>
// </td>
// </tr>
// </table>`;

//   return mailer.sendUpdateEmail(subject, html);
// }

// sendEmail()
//   .then(() => {
//     console.log('DONE');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.log('ERROR:', err);
//     process.exit(1);
//   });

const authResponse = require('../../middleware/auth-response');
const mailer = require('../../shared/mailer');

async function createMailingListSubscription(req, res, next) {
  const attributes = req.body;

  try {
    if (
      !attributes.emailAddress ||
      !attributes.firstName ||
      !attributes.id ||
      !attributes.lastName
    ) {
      throw new Error('Mailing list subscription not created due to missing fields.')
    }

    await mailer.addUserToMailingList({
      emailAddress: attributes.emailAddress,
      firstName: attributes.firstName,
      id: attributes.id,
      lastName: attributes.lastName
    });

    authResponse({
      message: 'Mailing list subscription successfully created.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function removeMailingListSubscription(req, res, next) {
  const emailAddress = req.params.emailAddress

  try {
    if (!emailAddress) {
      throw new Error('Please provide an email address.')
    }

    await mailer.removeEmailAddressFromMailingList(emailAddress);

    authResponse({
      message: 'Mailing list subscription successfully removed.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function updateMailingListSubscription(req, res, next) {
  const emailAddress = req.params.emailAddress
  const attributes = req.body;

  try {
    if (!emailAddress) {
      throw new Error('Please provide an email address.')
    }

    if (attributes.subscribed === undefined) {
      throw new Error('Please provide the `subscribed` attribute in the request body.');
    }

    await mailer.updateMailingListMember(emailAddress, {
      subscribed: attributes.subscribed
    });

    authResponse({
      message: 'Mailing list subscription successfully updated.'
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMailingListSubscription,
  removeMailingListSubscription,
  updateMailingListSubscription
};

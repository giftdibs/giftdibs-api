const { Feedback } = require('../../database/models/feedback');

const { handleError } = require('./shared');

const mailer = require('../../shared/mailer');

function createFeedback(req, res, next) {
  const attributes = req.body;

  if (attributes.gdNickname) {
    const error = new Error('You are a spam bot.');
    error.status = 108;
    next(error);
    return;
  }

  const isUrlRegExp = /^https?:\/\//;
  if (!isUrlRegExp.test(attributes.referrer)) {
    attributes.referrer = '';
  }

  const feedback = new Feedback({
    message: attributes.message,
    reason: attributes.reason,
    referrer: attributes.referrer,
  });

  feedback
    .save()
    .then((doc) => {
      return mailer
        .sendFeedbackEmail(
          attributes.reason,
          attributes.message,
          attributes.referrer
        )
        .then(() => doc);
    })
    .then((doc) => {
      res.json({
        data: {
          feedbackId: doc._id,
        },
        message: 'Feedback successfully sent.',
      });
    })
    .catch((err) => handleError(err, next));
}

module.exports = {
  createFeedback,
};

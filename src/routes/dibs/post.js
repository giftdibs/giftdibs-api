const authResponse = require('../../middleware/auth-response');

const { handleError } = require('./shared');

const { Gift } = require('../../database/models/gift');

async function createDib(req, res, next) {
  const userId = req.user._id;
  const giftId = req.params.giftId;
  const attributes = req.body;

  try {
    const dibId = await Gift.createDib(giftId, attributes, userId);

    authResponse({
      data: { dibId },
      message: 'Gift successfully dibbed!',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

async function markDibAsDelivered(req, res, next) {
  const dibId = req.params.dibId;
  const user = req.user;

  try {
    await Gift.markDibAsDelivered(dibId, user);

    authResponse({
      data: {},
      message: 'Dib successfully marked as delivered.',
    })(req, res, next);
  } catch (err) {
    handleError(err, next);
  }
}

module.exports = {
  createDib,
  markDibAsDelivered,
};

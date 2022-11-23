const express = require('express');

const { createFeedback } = require('./post');

const router = express.Router();

router.route('/feedback').post(createFeedback);

module.exports = router;

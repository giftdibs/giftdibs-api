const express = require('express');
const router = express.Router();

require('./users')(router);

module.exports = router;

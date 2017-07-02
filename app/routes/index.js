const express = require('express');
const router = express.Router();

require('./auth')(router);
require('./auth-facebook')(router);
require('./users')(router);

module.exports = router;

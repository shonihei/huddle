const express = require('express');

const router = express.Router();
const { checkIfAuthenticated } = require('../middlewares/auth-middleware');
const { generateAuthUrl, exchangeAuthorization, getAuthStatus } =
  require('../controllers/auth-controllers');

router.get('/', generateAuthUrl);
router.post('/', exchangeAuthorization);

router.get('/status', checkIfAuthenticated, getAuthStatus);

module.exports = router;

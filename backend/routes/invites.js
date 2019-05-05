const express = require('express');

const router = express.Router();
const { createNewInvite, updateInviteStatus } =
  require('../controllers/invites-controllers');
const { checkIfAuthenticated } = require('../middlewares/auth-middleware');

router.put('/:inviteId', checkIfAuthenticated, updateInviteStatus);
router.post('/', checkIfAuthenticated, createNewInvite);

module.exports = router;

const express = require('express');

const router = express.Router();
const { createNewRoom, getRooms } = require('../controllers/rooms-controllers');
const { checkIfAuthenticated } = require('../middlewares/auth-middleware');

router.get('/', checkIfAuthenticated, getRooms);
router.post('/', checkIfAuthenticated, createNewRoom);

module.exports = router;

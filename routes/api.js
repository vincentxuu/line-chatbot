const express = require('express');
const router = express.Router();

const ApiController = require('../controllers/apiController');

router.post('/sendMessage', ApiController.sendMessage);

module.exports = router;

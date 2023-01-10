const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

router.get('/', addressController.reverseMap);
router.get('/pickup', addressController.getPickupAddress);

module.exports = router;

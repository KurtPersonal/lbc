const express = require('express');
const router = express.Router();
const ncrController = require('../controllers/unmap.controller');

router.get('/map', ncrController.getAllNCRAddress);
router.get('/brgy', ncrController.getAllBarangaysOfThisCity);

module.exports = router;

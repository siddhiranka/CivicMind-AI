const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const complaintController = require('../controllers/complaintController');

router.post('/', upload.single('image'), complaintController.createComplaint);
router.get('/', complaintController.getComplaints);
router.patch('/:id/status', complaintController.updateStatus);
router.post('/seed', complaintController.seedComplaints);
router.get('/track/:id', complaintController.trackComplaint);

module.exports = router;

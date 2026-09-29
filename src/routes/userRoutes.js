const express = require('express');
const { getUsers, getUser, updateUserProfile, updateUserStatusController, deleteUserAccount } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidParamValidation } = require('../middleware/validation');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), uuidParamValidation, deleteUserAccount);

// User profile routes
router.get('/:id', uuidParamValidation, getUser);
router.put('/:id', uuidParamValidation, updateUserProfile);
router.put('/:id/status', uuidParamValidation, updateUserStatusController);

module.exports = router;
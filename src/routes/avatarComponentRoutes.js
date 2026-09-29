const express = require('express');
const { create, getAll, getById, getByCategory, update, remove } = require('../controllers/avatarComponentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidAvatarComponentIdParamValidation, avatarComponentValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), avatarComponentValidation, create);
router.get('/', getAll);
router.get('/category/:category', getByCategory);
router.get('/:id', uuidAvatarComponentIdParamValidation, getById);
router.put('/:id', uuidAvatarComponentIdParamValidation, avatarComponentValidation, authorize('admin'), update);
router.delete('/:id', uuidAvatarComponentIdParamValidation, authorize('admin'), remove);

module.exports = router;
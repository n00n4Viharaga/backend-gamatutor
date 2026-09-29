const express = require('express');
const { create, getAll, getById, getByCategory, update, remove } = require('../controllers/mslqStaticQuestionController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin')); // Only admin can manage static questions

router.post('/', mslqStaticQuestionValidation, create);
router.get('/', getAll);
router.get('/category/:category', getByCategory);
router.get('/:id', uuidMslqQuestionIdParamValidation, getById);
router.put('/:id', uuidMslqQuestionIdParamValidation, mslqStaticQuestionValidation, update);
router.delete('/:id', uuidMslqQuestionIdParamValidation, remove);

module.exports = router;
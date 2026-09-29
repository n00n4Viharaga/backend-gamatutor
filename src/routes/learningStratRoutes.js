const express = require('express');
const { create, getAll, getById, update, remove } = require('../controllers/learningStratController');
const { learningStratValidation, uuidLearningIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', learningStratValidation, create);
router.get('/', getAll);
router.get('/:id', uuidLearningIdParamValidation, getById);
router.put('/:id', uuidLearningIdParamValidation, learningStratValidation, update);
router.delete('/:id', uuidLearningIdParamValidation, remove);

module.exports = router;
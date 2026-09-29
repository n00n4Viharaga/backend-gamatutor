const express = require('express');
const { createNewCard, getCard, getCards, updateExistingCard, deleteExistingCard } = require('../controllers/cardController');
const { cardValidation, uuidParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', cardValidation, createNewCard);
router.get('/', getCards);
router.get('/:id', uuidParamValidation, getCard);
router.put('/:id', uuidParamValidation, cardValidation, updateExistingCard);
router.delete('/:id', uuidParamValidation, deleteExistingCard);

module.exports = router;
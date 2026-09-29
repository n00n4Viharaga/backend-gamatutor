const express = require('express');
const { createNewCardList, getCardList, updateExistingCardList, deleteExistingCardList, archive, restore } = require('../controllers/cardListController');
const { cardListValidation, uuidCardIdParamValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/', cardListValidation, createNewCardList);
router.get('/', uuidCardIdParamValidation, getCardList);
router.put('/', uuidCardIdParamValidation, cardListValidation, updateExistingCardList);
router.delete('/', uuidCardIdParamValidation, deleteExistingCardList);
router.put('/archive', uuidCardIdParamValidation, archive);
router.put('/restore', uuidCardIdParamValidation, restore);

module.exports = router;
const { createCardList, getCardListByCardId, updateCardList, deleteCardList, archiveCardList, restoreCardList } = require('../services/cardListService');

const createNewCardList = async (req, res, next) => {
  try {
    const cardList = await createCardList(req.params.cardId, req.user.userId, req.body);
    res.status(201).json({ cardList });
  } catch (error) {
    next(error);
  }
};

const getCardList = async (req, res, next) => {
  try {
    const cardList = await getCardListByCardId(req.params.cardId, req.user.userId);
    res.json({ cardList });
  } catch (error) {
    next(error);
  }
};

const updateExistingCardList = async (req, res, next) => {
  try {
    const cardList = await updateCardList(req.params.cardId, req.user.userId, req.body);
    res.json({ cardList });
  } catch (error) {
    next(error);
  }
};

const deleteExistingCardList = async (req, res, next) => {
  try {
    await deleteCardList(req.params.cardId, req.user.userId);
    res.json({ message: 'Card list deleted' });
  } catch (error) {
    next(error);
  }
};

const archive = async (req, res, next) => {
  try {
    const cardList = await archiveCardList(req.params.cardId, req.user.userId);
    res.json({ cardList });
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const cardList = await restoreCardList(req.params.cardId, req.user.userId);
    res.json({ cardList });
  } catch (error) {
    next(error);
  }
};

module.exports = { createNewCardList, getCardList, updateExistingCardList, deleteExistingCardList, archive, restore };
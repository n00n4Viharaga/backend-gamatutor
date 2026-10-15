const { CardList, Card } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createCardList = async (cardId, userId, data) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const existing = await CardList.findByPk(cardId);
  if (existing) {
    throw new AppError('Card list already exists for this card', 400);
  }

  return CardList.create({ cardId, subTitle: data.subTitle, endTimeList: data.endTimeList });
};

const getCardListByCardId = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId);

  if (!cardList) {
    throw new AppError('Card list not found', 404);
  }

  return cardList;
};

const updateCardList = async (cardId, userId, data) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId);
  if (!cardList) {
    throw new AppError('Card list not found', 404);
  }

  return cardList.update({ subTitle: data.subTitle, endTimeList: data.endTimeList });
};

const deleteCardList = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId);
  if (!cardList) {
    throw new AppError('Card list not found', 404);
  }

  await cardList.destroy();
  return { message: 'Card list deleted' };
};

module.exports = {
  createCardList,
  getCardListByCardId,
  updateCardList,
  deleteCardList
};
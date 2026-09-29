const { CardList, Card, LearningStrat } = require('../models');
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

  const learningStrat = await LearningStrat.findByPk(data.learningId);
  if (!learningStrat) {
    throw new AppError('Learning strategy not found', 404);
  }

  const cardListData = {
    cardId,
    learningId: data.learningId,
    subTitle: data.subTitle,
    description: data.description,
    courseName: data.courseName,
    difficulty: data.difficulty,
    priority: data.priority,
    url: data.url || '',
    startTime: data.startTime,
    endTime: data.endTime,
    deadline: data.deadline,
    archived: false,
    deleted: false
  };

  return CardList.create(cardListData);
};

const getCardListByCardId = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId, {
    include: [{ model: LearningStrat, as: 'learningStrat' }]
  });

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

  if (data.learningId) {
    const learningStrat = await LearningStrat.findByPk(data.learningId);
    if (!learningStrat) {
      throw new AppError('Learning strategy not found', 404);
    }
  }

  return cardList.update(data);
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

const archiveCardList = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId);
  if (!cardList) {
    throw new AppError('Card list not found', 404);
  }

  return cardList.update({ archived: true });
};

const restoreCardList = async (cardId, userId) => {
  const card = await Card.findOne({ where: { cardId, userId } });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  const cardList = await CardList.findByPk(cardId);
  if (!cardList) {
    throw new AppError('Card list not found', 404);
  }

  return cardList.update({ archived: false, deleted: false });
};

module.exports = {
  createCardList,
  getCardListByCardId,
  updateCardList,
  deleteCardList,
  archiveCardList,
  restoreCardList
};
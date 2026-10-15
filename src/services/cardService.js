const { Card, User, LearningStrat, CardList, ColumnMovement, CardListCollab } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createCard = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!data.nmMatkul) {
    throw new AppError('NmMatkul is required', 400);
  }
  if (!data.learningId) {
    throw new AppError('Learning strategy ID is required', 400);
  }

  const learningStrat = await LearningStrat.findByPk(data.learningId);
  if (!learningStrat) {
    throw new AppError('Learning strategy not found', 404);
  }

  return Card.create({ userId, ...data });
};

const getCardById = async (cardId, userId) => {
  const card = await Card.findOne({
    where: { cardId, userId },
    include: [
      { model: LearningStrat, as: 'learningStrat' },
      { model: CardList, as: 'cardList' },
      { model: ColumnMovement, as: 'columnMovements', separate: true },
      { 
        model: CardListCollab, 
        as: 'collaborations',
        separate: true,
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] 
      }
    ]
  });
  if (!card) {
    throw new AppError('Card not found', 404);
  }
  return card;
};

const updateCard = async (cardId, userId, data) => {
  const card = await Card.findOne({
    where: { cardId, userId }
  });
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  if (data.learningId) {
    const learningStrat = await LearningStrat.findByPk(data.learningId);
    if (!learningStrat) {
      throw new AppError('Learning strategy not found', 404);
    }
  }

  return card.update(data);
};

const deleteCard = async (cardId, userId) => {
  const card = await Card.findOne({
    where: { cardId, userId }
  });
  if (!card) {
    throw new AppError('Card not found', 404);
  }
  await card.destroy();
  return { message: 'Card deleted' };
};

const getUserCards = async (userId, filters = {}) => {
  const where = { userId };
  return Card.findAll({
    where,
    include: [
      { model: LearningStrat, as: 'learningStrat' },
      { model: CardList, as: 'cardList' }, // hasOne aman digabung
      { 
        model: ColumnMovement, 
        as: 'columnMovements', 
        separate: true, // PENTING: Mencegah Cartesian Product
        order: [['timestamp', 'ASC']]
      },
      { 
        model: CardListCollab, 
        as: 'collaborations',
        separate: true, // PENTING: Mencegah Cartesian Product
        include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }] 
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

module.exports = { createCard, getCardById, updateCard, deleteCard, getUserCards };
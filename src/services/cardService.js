const { Card, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createCard = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return Card.create({ userId, title: data.title });
};

const getCardById = async (cardId, userId) => {
  const card = await Card.findOne({
    where: { cardId, userId }
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
    order: [['createdAt', 'DESC']]
  });
};

module.exports = { createCard, getCardById, updateCard, deleteCard, getUserCards };
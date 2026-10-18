const { Card, User, LearningStrat, CardList, ColumnMovement, CardListCollab, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createCard = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!data.course_name) {
    throw new AppError('course_name is required', 400);
  }
  if (!data.learningStrat) {
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
      {
        model: CardList,
        as: 'cardList',
        separate: true // <--- TAMBAHKAN INI JUGA DI SINI
      },
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
  const transaction = await sequelize.transaction();

  try {
    const card = await Card.findOne({
      where: { cardId, userId },
      transaction
    });
    if (!card) {
      throw new AppError('Card not found', 404);
    }

    if (data.learningId) {
      const learningStrat = await LearningStrat.findByPk(data.learningId, { transaction });
      if (!learningStrat) {
        throw new AppError('Learning strategy not found', 404);
      }
    }

    // Tangani pembaruan subtasks jika dikirim dari Flutter
    if (data.subtasks !== undefined) {
      await CardList.destroy({ where: { cardId }, transaction });
      if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const subtasksData = data.subtasks.map((sub) => {
          const title = typeof sub === 'string' ? sub : sub.subTitle;
          return {
            cardId: card.cardId,
            subTitle: title,
            startTimeList: sub.startTimeList || null,
            endTimeList: sub.endTimeList || null,
          };
        });
        await CardList.bulkCreate(subtasksData, { transaction });
      }
      delete data.subtasks;
    }

    if (data.startTime && !card.startTime) {
      await ColumnMovement.create({
        cardId: card.cardId,
        fromColumn: 'planning',
        toColumn: 'monitoring',
        timestamp: data.startTime
      }, { transaction });
    }
    else if (!data.endTime && !card.endTime) {
      await ColumnMovement.create({
        cardId: card.cardId,
        fromColumn: 'monitoring',
        toColumn: 'controlling',
        timestamp: data.endtime
      }, { transaction });
    }
    else if (!data.reflection_completed_at) {
      await ColumnMovement.create({
        cardId: card.cardId,
        fromColumn: 'controlling',
        toColumn: 'reflection',
        timestamp: data.reflection_completed_at
      }, { transaction });
    }

    // Update data utama kartu
    await card.update(data, { transaction });

    await transaction.commit();
    return getCardById(cardId, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
  try {
    const where = { userId };
    return Card.findAll({
      where,
      include: [
        { model: LearningStrat, as: 'learningStrat' },
        {
          model: CardList,
          as: 'cardList',
          separate: true
        },
        {
          model: ColumnMovement,
          as: 'columnMovements',
          separate: true,
          order: [['timestamp', 'ASC']]
        },
        {
          model: CardListCollab,
          as: 'collaborations',
          separate: true,
          include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ cards });
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { createCard, getCardById, updateCard, deleteCard, getUserCards };
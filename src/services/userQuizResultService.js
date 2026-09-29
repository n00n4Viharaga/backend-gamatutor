const { UserQuizResult, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createQuizResult = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return UserQuizResult.create({
    userId,
    ...data
  });
};

const getAllQuizResults = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.dominantStrategy) where.dominantStrategy = filters.dominantStrategy;

  return UserQuizResult.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getQuizResultById = async (id) => {
  const result = await UserQuizResult.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!result) {
    throw new AppError('Quiz result not found', 404);
  }
  return result;
};

const getQuizResultsByUser = async (userId, filters = {}) => {
  const where = { userId };
  return UserQuizResult.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getLatestQuizResultByUser = async (userId) => {
  return UserQuizResult.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

const updateQuizResult = async (id, data) => {
  const result = await UserQuizResult.findByPk(id);
  if (!result) {
    throw new AppError('Quiz result not found', 404);
  }
  return result.update(data);
};

const deleteQuizResult = async (id) => {
  const result = await UserQuizResult.findByPk(id);
  if (!result) {
    throw new AppError('Quiz result not found', 404);
  }
  await result.destroy();
  return { message: 'Quiz result deleted' };
};

module.exports = {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getQuizResultsByUser,
  getLatestQuizResultByUser,
  updateQuizResult,
  deleteQuizResult
};
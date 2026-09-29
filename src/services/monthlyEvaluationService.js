const { MonthlyEvaluation, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const createMonthlyEvaluation = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if evaluation for this month already exists
  const existing = await MonthlyEvaluation.findOne({
    where: { userId, monthYear: data.monthYear }
  });
  if (existing) {
    throw new AppError('Monthly evaluation for this month already exists', 400);
  }

  return MonthlyEvaluation.create({
    userId,
    ...data
  });
};

const getAllMonthlyEvaluations = async (filters = {}) => {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.monthYear) where.monthYear = filters.monthYear;
  if (filters.isSynchronized !== undefined) where.isSynchronized = filters.isSynchronized;

  return MonthlyEvaluation.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getMonthlyEvaluationById = async (id) => {
  const eval = await MonthlyEvaluation.findByPk(id, {
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!eval) {
    throw new AppError('Monthly evaluation not found', 404);
  }
  return eval;
};

const getMonthlyEvaluationsByUser = async (userId, filters = {}) => {
  const where = { userId };
  if (filters.monthYear) where.monthYear = filters.monthYear;

  return MonthlyEvaluation.findAll({
    where,
    order: [['monthYear', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getMonthlyEvaluationByUserAndMonth = async (userId, monthYear) => {
  return MonthlyEvaluation.findOne({
    where: { userId, monthYear }
  });
};

const updateMonthlyEvaluation = async (id, data) => {
  const eval = await MonthlyEvaluation.findByPk(id);
  if (!eval) {
    throw new AppError('Monthly evaluation not found', 404);
  }
  return eval.update(data);
};

const deleteMonthlyEvaluation = async (id) => {
  const eval = await MonthlyEvaluation.findByPk(id);
  if (!eval) {
    throw new AppError('Monthly evaluation not found', 404);
  }
  await eval.destroy();
  return { message: 'Monthly evaluation deleted' };
};

module.exports = {
  createMonthlyEvaluation,
  getAllMonthlyEvaluations,
  getMonthlyEvaluationById,
  getMonthlyEvaluationsByUser,
  getMonthlyEvaluationByUserAndMonth,
  updateMonthlyEvaluation,
  deleteMonthlyEvaluation
};
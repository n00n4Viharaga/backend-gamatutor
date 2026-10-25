const { MonthlyEvaluation, Card, User } = require('../models'); // ★ Tambahkan User
const { evaluatePerformance } = require('../utils/evalAlgorithma');
const llmEvalService = require('./llmEvalService');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// ★ FUNGSI BARU: Cek & Generate Evaluasi
exports.checkAndGenerate = async (userId) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  let existingEval = await MonthlyEvaluation.findOne({ where: { userId, monthYear: currentMonth } });
  if (existingEval) return { show_eval: true, evaluation: existingEval };

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cards = await Card.findAll({ where: { userId, createdAt: { [Op.gte]: thirtyDaysAgo }, deleted: false } });

  const evalResult = evaluatePerformance(cards);
  const feedback = await llmEvalService.generateMonthlyFeedback({
    total_score: evalResult.total_score, total_cards: cards.length,
    completion_rate: evalResult.completion_rate, stalled_cards: evalResult.stalled_cards,
    requires_retake: evalResult.requires_retake
  });

  const newEval = await MonthlyEvaluation.create({
    userId, monthYear: currentMonth,
    isSynchronized: !evalResult.requires_retake,
    requiresQuizRetake: evalResult.requires_retake,
    detectedIssues: { ...evalResult }, llmFeedback: feedback
  });

  return { show_eval: true, evaluation: newEval };
};

// ★ FUNGSI BARU: Simpan Refleksi
exports.submitReflection = async (userId, monthYear, userReason) => {
  const monthlyEval = await MonthlyEvaluation.findOne({ where: { userId, monthYear } });
  if (!monthlyEval) throw new Error('Evaluasi tidak ditemukan');

  const updatedIssues = { ...monthlyEval.detectedIssues, user_reflection_reason: userReason };
  const newFeedback = await llmEvalService.generateMonthlyFeedback(updatedIssues, userReason);

  await monthlyEval.update({ detectedIssues: updatedIssues, llmFeedback: newFeedback });
  return { show_eval: true, evaluation: monthlyEval };
};

// ─── FUNGSI CRUD BAWAAN ───
const createMonthlyEvaluation = async (userId, dataPayload) => { // ★ Rename parameter 'data' menjadi 'dataPayload'
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const existing = await MonthlyEvaluation.findOne({
    where: { userId, monthYear: dataPayload.monthYear }
  });
  if (existing) {
    throw new AppError('Monthly evaluation for this month already exists', 400);
  }

  return MonthlyEvaluation.create({
    userId,
    ...dataPayload
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
  const evaluation = await MonthlyEvaluation.findByPk(id, { // ★ Rename variabel 'data' jadi 'evaluation'
    include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'username'] }]
  });
  if (!evaluation) {
    throw new AppError('Monthly evaluation not found', 404);
  }
  return evaluation;
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

const updateMonthlyEvaluation = async (id, dataPayload) => { // ★ Rename parameter
  const evaluation = await MonthlyEvaluation.findByPk(id); // ★ Rename variabel dalam
  if (!evaluation) {
    throw new AppError('Monthly evaluation not found', 404);
  }
  return evaluation.update(dataPayload);
};

const deleteMonthlyEvaluation = async (id) => {
  const evaluation = await MonthlyEvaluation.findByPk(id); // ★ Rename variabel dalam (jangan pakai 'id' lagi)
  if (!evaluation) { // ★ Sebelumnya error karena ngecek variabel 'data'
    throw new AppError('Monthly evaluation not found', 404);
  }
  await evaluation.destroy();
  return { message: 'Monthly evaluation deleted' };
};

// ─── EXPORT SEMUA FUNGSI ───
module.exports = {
  checkAndGenerate: exports.checkAndGenerate,
  submitReflection: exports.submitReflection,
  createMonthlyEvaluation,
  getAllMonthlyEvaluations,
  getMonthlyEvaluationById,
  getMonthlyEvaluationsByUser,
  getMonthlyEvaluationByUserAndMonth,
  updateMonthlyEvaluation,
  deleteMonthlyEvaluation
};
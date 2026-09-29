const {
  createMonthlyEvaluation,
  getAllMonthlyEvaluations,
  getMonthlyEvaluationById,
  getMonthlyEvaluationsByUser,
  getMonthlyEvaluationByUserAndMonth,
  updateMonthlyEvaluation,
  deleteMonthlyEvaluation
} = require('../services/monthlyEvaluationService');

const create = async (req, res, next) => {
  try {
    const evaluation = await createMonthlyEvaluation(req.user.userId, req.body);
    res.status(201).json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      monthYear: req.query.monthYear,
      isSynchronized: req.query.isSynchronized === 'true' ? true : req.query.isSynchronized === 'false' ? false : undefined,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const evaluations = await getAllMonthlyEvaluations(filters);
    res.json({ monthlyEvaluations: evaluations });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const evaluation = await getMonthlyEvaluationById(req.params.id);
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      monthYear: req.query.monthYear,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const evaluations = await getMonthlyEvaluationsByUser(req.params.userId, filters);
    res.json({ monthlyEvaluations: evaluations });
  } catch (error) {
    next(error);
  }
};

const getByUserAndMonth = async (req, res, next) => {
  try {
    const evaluation = await getMonthlyEvaluationByUserAndMonth(req.params.userId, req.params.monthYear);
    if (!evaluation) {
      return res.status(404).json({ error: 'Monthly evaluation not found' });
    }
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const evaluation = await updateMonthlyEvaluation(req.params.id, req.body);
    res.json({ monthlyEvaluation: evaluation });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteMonthlyEvaluation(req.params.id);
    res.json({ message: 'Monthly evaluation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByUser, getByUserAndMonth, update, remove };
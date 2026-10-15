const { LearningStrat } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const createLearningStrat = async (data) => {
  return LearningStrat.create({
    keyCode: data.keyCode,
    learningStrategy: data.learningStrategy,
    description: data.description
  });
};

const getAllLearningStrats = async () => {
  return LearningStrat.findAll({ order: [['learningStrategy', 'ASC']] });
};

const getLearningStratById = async (id) => {
  const learningStrat = await LearningStrat.findByPk(id);
  if (!learningStrat) {
    throw new AppError('Learning strategy not found', 404);
  }
  return learningStrat;
};

const updateLearningStrat = async (id, data) => {
  const learningStrat = await LearningStrat.findByPk(id);
  if (!learningStrat) {
    throw new AppError('Learning strategy not found', 404);
  }
  return learningStrat.update(data);
};

const deleteLearningStrat = async (id) => {
  const learningStrat = await LearningStrat.findByPk(id);
  if (!learningStrat) {
    throw new AppError('Learning strategy not found', 404);
  }
  await learningStrat.destroy();
  return { message: 'Learning strategy deleted' };
};

module.exports = {
  createLearningStrat,
  getAllLearningStrats,
  getLearningStratById,
  updateLearningStrat,
  deleteLearningStrat
};
const { createLearningStrat, getAllLearningStrats, getLearningStratById, updateLearningStrat, deleteLearningStrat } = require('../services/learningStratService');

const create = async (req, res, next) => {
  try {
    const learningStrat = await createLearningStrat(req.body);
    res.status(201).json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const learningStrats = await getAllLearningStrats();
    res.json({ learningStrats });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const learningStrat = await getLearningStratById(req.params.id);
    res.json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const learningStrat = await updateLearningStrat(req.params.id, req.body);
    res.json({ learningStrat });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteLearningStrat(req.params.id);
    res.json({ message: 'Learning strategy deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
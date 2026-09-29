const {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogById,
  getActivityLogsByUser,
  getActivityLogsByType,
  deleteActivityLog
} = require('../services/userActivityLogService');

const create = async (req, res, next) => {
  try {
    const log = await createActivityLog(req.user.userId, req.body);
    res.status(201).json({ activityLog: log });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      activityType: req.query.activityType,
      refId: req.query.refId,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const logs = await getAllActivityLogs(filters);
    res.json({ activityLogs: logs });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const log = await getActivityLogById(req.params.id);
    res.json({ activityLog: log });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const filters = {
      activityType: req.query.activityType,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const logs = await getActivityLogsByUser(req.params.userId, filters);
    res.json({ activityLogs: logs });
  } catch (error) {
    next(error);
  }
};

const getByType = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };
    const logs = await getActivityLogsByType(req.params.activityType, filters);
    res.json({ activityLogs: logs });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteActivityLog(req.params.id);
    res.json({ message: 'Activity log deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, getByUser, getByType, remove };
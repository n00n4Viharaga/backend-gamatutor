const { getAllUsers, getUserById, updateUser, updateUserStatus, deleteUser } = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers(req.query);
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatusController = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await updateUserStatus(req.params.id, status);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const deleteUserAccount = async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserProfile,
  updateUserStatusController,
  deleteUserAccount
};
const { register, login, getMe, logout, refresh, forgotPassword, resetPassword } = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

const registerUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, role, status } = req.body;

    const { user, token } = await register({
      email,
      password,
      firstName,
      lastName,
      username,
      role,
      status
    });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login(email, password);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getMe(req.user.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.split(' ')[1];
    await logout(req.user.userId, currentToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { user, token } = await refresh(req.user.userId);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await resetPassword(resetToken, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getCurrentUser, logoutUser, refreshToken, forgotPasswordController, resetPasswordController };
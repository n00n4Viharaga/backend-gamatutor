const { register, login, loginGoogle, getMe, logout, refresh, forgotPassword, resetPassword } = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const user = require('../models/user');

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

const registerUserbyGoogle = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, role, status } = req.body;

    const { user, token } = await register({
      email,
      password: 'GOOGLE_AUTH',
      firstName,
      lastName,
      username,
      role: 'user',
      status: 'online'
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

const loginByGoogle = async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const { user, token } = await authService.loginGoogle(email);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(401).json({ message: 'Google token invalid' });
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

module.exports = { registerUser, registerUserbyGoogle, loginUser, loginByGoogle, getCurrentUser, logoutUser, refreshToken, forgotPasswordController, resetPasswordController };
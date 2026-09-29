const { Friendship, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const sendFriendRequest = async (userId, friendId) => {
  if (userId === friendId) {
    throw new AppError('Cannot send friend request to yourself', 400);
  }

  const friend = await User.findByPk(friendId);
  if (!friend) {
    throw new AppError('User not found', 404);
  }

  const existing = await Friendship.findOne({
    where: {
      [Op.or]: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    }
  });

  if (existing) {
    throw new AppError('Friend request already exists', 400);
  }

  return Friendship.create({
    userId,
    friendId,
    status: 'pending'
  });
};

const getAllFriendships = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getFriendshipById = async (id) => {
  const friendship = await Friendship.findByPk(id, {
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ]
  });
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }
  return friendship;
};

const getUserFriends = async (userId, filters = {}) => {
  const where = {
    [Op.or]: [
      { userId, status: 'accepted' },
      { friendId: userId, status: 'accepted' }
    ]
  };

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] },
      { model: User, as: 'friend', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const getPendingRequests = async (userId, filters = {}) => {
  const where = {
    friendId: userId,
    status: 'pending'
  };

  return Friendship.findAll({
    where,
    include: [
      { model: User, as: 'requester', attributes: ['userId', 'firstName', 'lastName', 'username'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

const acceptFriendRequest = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friend request not found', 404);
  }

  if (friendship.friendId !== userId) {
    throw new AppError('Not authorized to accept this request', 403);
  }

  if (friendship.status !== 'pending') {
    throw new AppError('Request is not pending', 400);
  }

  return friendship.update({ status: 'accepted', updatedAt: new Date() });
};

const blockFriend = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }

  if (friendship.userId !== userId && friendship.friendId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return friendship.update({ status: 'blocked', updatedAt: new Date() });
};

const rejectFriendRequest = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friend request not found', 404);
  }

  if (friendship.friendId !== userId) {
    throw new AppError('Not authorized to reject this request', 403);
  }

  if (friendship.status !== 'pending') {
    throw new AppError('Request is not pending', 400);
  }

  await friendship.destroy();
  return { message: 'Friend request rejected' };
};

const removeFriendship = async (id, userId) => {
  const friendship = await Friendship.findByPk(id);
  if (!friendship) {
    throw new AppError('Friendship not found', 404);
  }

  if (friendship.userId !== userId && friendship.friendId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  await friendship.destroy();
  return { message: 'Friendship removed' };
};

module.exports = {
  sendFriendRequest,
  getAllFriendships,
  getFriendshipById,
  getUserFriends,
  getPendingRequests,
  acceptFriendRequest,
  blockFriend,
  rejectFriendRequest,
  removeFriendship
};
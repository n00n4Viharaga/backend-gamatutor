const { UserAvatar, User, AvatarComponent } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const getUserAvatar = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  let avatar = await UserAvatar.findByPk(userId, {
    include: [
      { model: AvatarComponent, as: 'hair', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'face', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'shirt', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'pants', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'special', attributes: ['avaId', 'name', 'assetPath'] }
    ]
  });

  if (!avatar) {
    // Create empty avatar if not exists
    avatar = await UserAvatar.create({ userId });
    // Re-fetch with includes
    avatar = await UserAvatar.findByPk(userId, {
      include: [
        { model: AvatarComponent, as: 'hair', attributes: ['avaId', 'name', 'assetPath'] },
        { model: AvatarComponent, as: 'face', attributes: ['avaId', 'name', 'assetPath'] },
        { model: AvatarComponent, as: 'shirt', attributes: ['avaId', 'name', 'assetPath'] },
        { model: AvatarComponent, as: 'pants', attributes: ['avaId', 'name', 'assetPath'] },
        { model: AvatarComponent, as: 'special', attributes: ['avaId', 'name', 'assetPath'] }
      ]
    });
  }

  return avatar;
};

const updateUserAvatar = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Validate component IDs exist
  for (const key of ['hairId', 'faceId', 'shirtId', 'pantsId', 'specialId']) {
    if (data[key]) {
      const component = await AvatarComponent.findByPk(data[key]);
      if (!component) {
        throw new AppError(`Avatar component ${key} not found`, 404);
      }
      // Validate category matches
      const expectedCategory = key.replace('Id', '');
      if (component.category !== expectedCategory) {
        throw new AppError(`Invalid component for ${expectedCategory}`, 400);
      }
    }
  }

  let avatar = await UserAvatar.findByPk(userId);
  if (!avatar) {
    avatar = await UserAvatar.create({ userId, ...data });
  } else {
    await avatar.update(data);
  }

  // Re-fetch with includes
  return UserAvatar.findByPk(userId, {
    include: [
      { model: AvatarComponent, as: 'hair', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'face', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'shirt', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'pants', attributes: ['avaId', 'name', 'assetPath'] },
      { model: AvatarComponent, as: 'special', attributes: ['avaId', 'name', 'assetPath'] }
    ]
  });
};

module.exports = {
  getUserAvatar,
  updateUserAvatar
};
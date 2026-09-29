'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Chat.init({
    chatId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'chat_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    messageChat: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'message_chat'
    },
    timeChat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'time_chat'
    }
  }, {
    sequelize,
    modelName: 'Chat',
    tableName: 'chat',
    timestamps: false
  });

  return Chat;
};
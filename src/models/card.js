'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    static associate(models) {
      Card.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Card.hasOne(models.CardList, { foreignKey: 'cardId', as: 'cardList' });
      Card.hasMany(models.ColumnMovement, { foreignKey: 'cardId', as: 'columnMovements' });
    }
  }

  Card.init({
    cardId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'card_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Card',
    tableName: 'cards',
    timestamps: false
  });

  return Card;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CardList extends Model {
    static associate(models) {
      CardList.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
      CardList.belongsTo(models.LearningStrat, { foreignKey: 'learningId', as: 'learningStrat' });
    }
  }

  CardList.init({
    cardId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: 'cards', key: 'card_id' },
      field: 'card_id'
    },
    subTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'sub_title'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    courseName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'course_name'
    },
    difficulty: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['easy', 'medium', 'hard', 'expert']]
      }
    },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']]
      }
    },
    learningId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'learning_strats', key: 'learning_id' },
      field: 'learning_id'
    },
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    satisfactionRating: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'satisfaction_rating'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preTestGrade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pre_test_grade'
    },
    postTestGrade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'post_test_grade'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at'
    },
    reflectionQ1Strategy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q1_strategy'
    },
    reflectionQ2Confidence: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'reflection_q2_confidence'
    },
    reflectionQ3WhatLearned: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q3_what_learned'
    },
    reflectionQ4Value: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reflection_q4_value'
    },
    reflectionCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reflection_completed_at'
    },
    personalBestTime: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'personal_best_time'
    },
    personalBestGrade: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'personal_best_grade'
    },
    personalBestAchievedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'personal_best_achieved_at'
    },
    goalCheckRating: {
      type: DataTypes.NUMERIC,
      allowNull: true,
      field: 'goal_check_rating'
    },
    goalCheckTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'goal_check_timestamp'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'deadline'
    }
  }, {
    sequelize,
    modelName: 'CardList',
    tableName: 'card_list',
    timestamps: false
  });

  return CardList;
};
const { sequelize } = require('../config/database');
const User = require('./user');
const Token = require('./token');
const Card = require('./card');
const CardList = require('./cardList');
const LearningStrat = require('./learningStrat');
const ColumnMovement = require('./columnMovement');
const Notification = require('./notification');
const Chat = require('./chat');
const Friendship = require('./friendship');
const LlmPromptTemplate = require('./llmPromptTemplate');
const MslqStaticQuestion = require('./mslqStaticQuestion');
const UserQuizResult = require('./userQuizResult');
const MonthlyEvaluation = require('./monthlyEvaluation');
const CardListCollab = require('./cardListCollab');
const CardListChat = require('./cardListChat');
const UserActivityLog = require('./userActivityLog');
const LlmRecommendationHistory = require('./llmRecommendationHistory');
const AvatarComponent = require('./avatarComponent');
const UserAvatar = require('./userAvatar');
const AvatarUnlock = require('./avatarUnlock');

// A. USER MANAGEMENT & AUTHENTICATION
// User -> Token (1:M)
User.hasMany(Token, { foreignKey: 'userId', as: 'tokens' });
Token.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Card (1:M)
User.hasMany(Card, { foreignKey: 'userId', as: 'cards' });
Card.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Notification (1:M)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Friendship (1:M) - as requester
User.hasMany(Friendship, { foreignKey: 'userId', as: 'friendRequestsSent' });
Friendship.belongsTo(User, { foreignKey: 'userId', as: 'requester' });

// User -> Friendship (1:M) - as friend
User.hasMany(Friendship, { foreignKey: 'friendId', as: 'friendRequestsReceived' });
Friendship.belongsTo(User, { foreignKey: 'friendId', as: 'friend' });

// User -> Chat (1:M) - as sender
User.hasMany(Chat, { foreignKey: 'userId', as: 'chats' });
Chat.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserQuizResult (1:M)
User.hasMany(UserQuizResult, { foreignKey: 'userId', as: 'quizResults' });
UserQuizResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> MonthlyEvaluation (1:M)
User.hasMany(MonthlyEvaluation, { foreignKey: 'userId', as: 'monthlyEvaluations' });
MonthlyEvaluation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserActivityLog (1:M)
User.hasMany(UserActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
UserActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> LlmRecommendationHistory (1:M)
User.hasMany(LlmRecommendationHistory, { foreignKey: 'userId', as: 'recommendationHistories' });
LlmRecommendationHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> CardListCollab (1:M)
User.hasMany(CardListCollab, { foreignKey: 'userId', as: 'collaborations' });
CardListCollab.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> CardListChat (1:M)
User.hasMany(CardListChat, { foreignKey: 'userId', as: 'cardListChats' });
CardListChat.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> UserAvatar (1:1)
User.hasOne(UserAvatar, { foreignKey: 'userId', as: 'avatar' });
UserAvatar.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> AvatarUnlock (1:M)
User.hasMany(AvatarUnlock, { foreignKey: 'userId', as: 'avatarUnlocks' });
AvatarUnlock.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// C. STRATEGI BELAJAR & CARD MANAGEMENT
// Card -> CardList (1:1) - card_list.card_id is PK and FK to cards
Card.hasOne(CardList, { foreignKey: 'cardId', as: 'cardList' });
CardList.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// LearningStrat -> CardList (1:M)
LearningStrat.hasMany(CardList, { foreignKey: 'learningId', as: 'cardLists' });
CardList.belongsTo(LearningStrat, { foreignKey: 'learningId', as: 'learningStrat' });

// Card -> ColumnMovement (1:M)
Card.hasMany(ColumnMovement, { foreignKey: 'cardId', as: 'columnMovements' });
ColumnMovement.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

// D. KOLABORASI, CHAT & SOSIAL
// Chat -> User (1:M) - as friend/recipient
Chat.belongsTo(User, { foreignKey: 'friendId', as: 'recipient' });
User.hasMany(Chat, { foreignKey: 'friendId', as: 'receivedChats' });

// CardList -> CardListCollab (1:M)
CardList.hasMany(CardListCollab, { foreignKey: 'cardId', as: 'collaborations' });
CardListCollab.belongsTo(CardList, { foreignKey: 'cardId', as: 'cardList' });

// CardListCollab -> CardListChat (1:M)
CardListCollab.hasMany(CardListChat, { foreignKey: 'collabId', as: 'chats' });
CardListChat.belongsTo(CardListCollab, { foreignKey: 'collabId', as: 'collab' });

// E. GAMIFIKASI (AVATAR)
// AvatarComponent -> UserAvatar (1:M) - multiple associations
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'hairId', as: 'hairUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'faceId', as: 'faceUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'shirtId', as: 'shirtUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'pantsId', as: 'pantsUsers' });
AvatarComponent.hasMany(UserAvatar, { foreignKey: 'specialId', as: 'specialUsers' });

// AvatarComponent -> AvatarUnlock (1:M)
AvatarComponent.hasMany(AvatarUnlock, { foreignKey: 'componentId', as: 'unlocks' });
AvatarUnlock.belongsTo(AvatarComponent, { foreignKey: 'componentId', as: 'component' });

// UserAvatar -> AvatarComponent (M:1) - multiple associations
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'hairId', as: 'hair' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'faceId', as: 'face' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'shirtId', as: 'shirt' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'pantsId', as: 'pants' });
UserAvatar.belongsTo(AvatarComponent, { foreignKey: 'specialId', as: 'special' });

module.exports = {
  User,
  Token,
  Card,
  CardList,
  LearningStrat,
  ColumnMovement,
  Notification,
  Chat,
  Friendship,
  LlmPromptTemplate,
  MslqStaticQuestion,
  UserQuizResult,
  MonthlyEvaluation,
  CardListCollab,
  CardListChat,
  UserActivityLog,
  LlmRecommendationHistory,
  AvatarComponent,
  UserAvatar,
  AvatarUnlock,
  sequelize
};
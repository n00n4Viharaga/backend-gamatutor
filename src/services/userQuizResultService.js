const { UserQuizResult, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const CATEGORIES = Object.freeze([
  'organization',
  'time_management',
  'metacognitive_self_regulation',
  'help_seeking',
  'elaboration',
  'rehearsal',
]);

const EXPECTED_QUESTIONS_PER_CATEGORY = 4;
const EXPECTED_TOTAL_QUESTIONS = 24;

const CATEGORY_WEIGHTS = Object.freeze(
  Object.fromEntries(CATEGORIES.map(c => [c, 1.0]))
);

const PROFILE_NAMES = Object.freeze({
  organization:                  'The Architect',
  time_management:               'The Planner',
  metacognitive_self_regulation: 'The Reflector',
  help_seeking:                  'The Collaborator',
  elaboration:                   'The Connector',
  rehearsal:                     'The Memorizer',
});

const THRESHOLDS = Object.freeze({
  HIGH:   70,
  MEDIUM: 40,
  UNLOCK: 60,
  BALANCED_SPREAD: 20,
});

const MIN_SCORE_PER_QUESTION = 1;
const MAX_SCORE_PER_QUESTION = 3;

// ─── XP Constants ───
const XP_PER_QUESTION     = 10;
const XP_BONUS_IDEAL      = 5;   // bonus jika pilih opsi skor 3

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════
function validateQuizPayload(payload) {
  const errors = [];

  if (!Array.isArray(payload)) {
    return { valid: false, errors: ['Payload harus berupa array.'] };
  }

  if (payload.length !== EXPECTED_TOTAL_QUESTIONS) {
    errors.push(
      `Jumlah jawaban harus ${EXPECTED_TOTAL_QUESTIONS}, ` +
      `ditemukan ${payload.length}.`
    );
  }

  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

  for (let i = 0; i < payload.length; i++) {
    const item = payload[i];
    const where = `item[${i}]`;

    if (!item || typeof item !== 'object') {
      errors.push(`${where}: bukan objek valid.`);
      continue;
    }
    if (!CATEGORIES.includes(item.category)) {
      errors.push(`${where}: kategori "${item.category}" tidak dikenal.`);
      continue;
    }
    if (![1, 2, 3].includes(item.score)) {
      errors.push(`${where}: skor harus 1, 2, atau 3 (ditemukan: ${item.score}).`);
      continue;
    }
    counts[item.category]++;
  }

  for (const cat of CATEGORIES) {
    if (counts[cat] !== EXPECTED_QUESTIONS_PER_CATEGORY) {
      errors.push(
        `Kategori "${cat}" harus punya ${EXPECTED_QUESTIONS_PER_CATEGORY} soal, ` +
        `ditemukan ${counts[cat]}.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════
// SCORING PIPELINE
// ═══════════════════════════════════════════════════════════════
function aggregateScores(answers) {
  const raw    = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

  for (const { category, score } of answers) {
    raw[category]    += score;
    counts[category] += 1;
  }
  return { raw, counts };
}

function normalizeScores(raw, counts) {
  const normalized = {};

  for (const cat of CATEGORIES) {
    const count = counts[cat];
    if (count === 0) { normalized[cat] = 0; continue; }

    const minSum = count * MIN_SCORE_PER_QUESTION;
    const maxSum = count * MAX_SCORE_PER_QUESTION;
    const range  = maxSum - minSum;

    const baseRatio = range === 0 ? 0 : (raw[cat] - minSum) / range;
    const weighted  = baseRatio * 100 * CATEGORY_WEIGHTS[cat];

    normalized[cat] = Math.round(Math.max(0, Math.min(100, weighted)));
  }
  return normalized;
}

function classifyLevel(score) {
  if (score >= THRESHOLDS.HIGH)   return 'high';
  if (score >= THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

function rankCategories(normalized) {
  return Object.entries(normalized)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
}

function determineProfile(ranked) {
  const top    = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const spread = top.score - bottom.score;
  const isBalanced = spread <= THRESHOLDS.BALANCED_SPREAD;

  return {
    dominant_strategy: top.category,
    user_profile: isBalanced ? 'The All-Rounder' : PROFILE_NAMES[top.category],
    is_balanced: isBalanced,
    spread,
  };
}

function buildRecommendation(ranked) {
  const unlocked = ranked
    .filter(r => r.score < THRESHOLDS.UNLOCK)
    .map(r => r.category);

  if (unlocked.length === 0) {
    unlocked.push(ranked[ranked.length - 1].category);
  }

  const locked = ranked
    .filter(r => r.score >= THRESHOLDS.UNLOCK)
    .map(r => r.category);

  return { unlocked_features: unlocked, locked_features: locked };
}

// ═══════════════════════════════════════════════════════════════
// XP & STREAK HELPERS  ← ★★ BARU ★★
// ═══════════════════════════════════════════════════════════════
function calculateXp(answers) {
  return answers.reduce(
    (sum, a) => sum + XP_PER_QUESTION + (a.score === 3 ? XP_BONUS_IDEAL : 0),
    0
  );
}

async function calculateStreak(userId) {
  // Ambil maks 60 attempt terakhir untuk deteksi streak harian
  const results = await UserQuizResult.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 60,
    attributes: ['createdAt'],
    raw: true,
  });

  if (results.length === 0) return 1;

  const dayKey = (dt) => {
    const d = new Date(dt);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  let streak = 1;
  let prev   = new Date(results[0].createdAt);
  prev.setHours(0, 0, 0, 0);

  for (let i = 1; i < results.length; i++) {
    const curr = new Date(results[i].createdAt);
    curr.setHours(0, 0, 0, 0);

    // Lewati attempt di hari yang sama (multiple quiz dalam sehari)
    if (dayKey(curr) === dayKey(prev)) continue;

    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
      prev = curr;
    } else {
      break; // gap ≥ 2 hari → streak berhenti
    }
  }
  return streak;
}

const calculateQuizResult = (inputData) => {
  // Ekstrak payload — fleksibel terhadap berbagai bentuk input
  const answersPayload = Array.isArray(inputData)
    ? inputData
    : (inputData?.answersPayload ?? Object.values(inputData ?? {}));

  // ✅ FIX BUG 1: gunakan answersPayload, bukan answers
  const validation = validateQuizPayload(answersPayload);
  if (!validation.valid) {
    const err = new Error('Payload kuis tidak valid.');
    err.details = validation.errors;
    throw err;
  }

  // ✅ FIX BUG 2: gunakan answersPayload, bukan answers
  const { raw, counts } = aggregateScores(answersPayload);
  const normalized = normalizeScores(raw, counts);
  const ranked = rankCategories(normalized);
  const levels = Object.fromEntries(
    ranked.map(r => [r.category, classifyLevel(r.score)])
  );
  const profile        = determineProfile(ranked);
  const recommendation = buildRecommendation(ranked);

  return {
    // Ringkasan untuk UI
    dominant_strategy: profile.dominant_strategy,
    user_profile:      profile.user_profile,
    is_balanced:       profile.is_balanced,
    spread:            profile.spread,

    // Data detail
    raw_scores:        raw,
    normalized_scores: normalized,
    levels,
    ranked,
    question_counts:   counts,

    // Fitur
    unlocked_features: recommendation.unlocked_features,
    locked_features:   recommendation.locked_features,

    // Metadata
    computed_at:       new Date().toISOString(),
    algorithm_version: '1.0.0',
  };
};

// ═══════════════════════════════════════════════════════════════
// CREATE — ★★ DIPERBAIKI: return payload lengkap untuk Flutter ★★
// ═══════════════════════════════════════════════════════════════
const createQuizResult = async (userId, answersPayload) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // ─── Hitung semua metrik ───
  const calculatedData = calculateQuizResult(answersPayload);
  const xp_earned      = calculateXp(answersPayload);
  const streak_days    = await calculateStreak(userId);

  // ─── Simpan ke DB dengan payload yang sudah diperkaya ───
  const saved = await UserQuizResult.create({
    userId,
    dominantStrategy: calculatedData.dominant_strategy,
    userProfile:      calculatedData.user_profile,
    unlockedFeatures: calculatedData.unlocked_features,
    lockedFeatures:   calculatedData.locked_features,

    // ★ Simpan data detail untuk audit tesis
    answersPayload: {
      answers:           answersPayload,
      normalized_scores: calculatedData.normalized_scores,
      levels:            calculatedData.levels,
      ranked:            calculatedData.ranked,
      xp_earned,
      streak_days,
      algorithm_version: calculatedData.algorithm_version,
    },
  });

  // ★ Return payload lengkap untuk Flutter
  return {
    quiz_result_id:    saved.quizResultId,
    created_at:        saved.createdAt,

    // Field untuk UI utama
    user_profile:      calculatedData.user_profile,
    dominant_strategy: calculatedData.dominant_strategy,
    unlocked_features: calculatedData.unlocked_features,
    locked_features:   calculatedData.locked_features,
    normalized_scores: calculatedData.normalized_scores,

    // Field gamifikasi (untuk hero card & radar chart)
    xp_earned,
    streak_days,

    // Field audit / analitik (opsional untuk UI)
    levels:            calculatedData.levels,
    ranked:            calculatedData.ranked,
    is_balanced:       calculatedData.is_balanced,
    spread:            calculatedData.spread,
    algorithm_version: calculatedData.algorithm_version,
  };
};

// ═══════════════════════════════════════════════════════════════
// FUNGSI LAIN (tidak berubah)
// ═══════════════════════════════════════════════════════════════
const getAllQuizResults = async (filters = {}) => {
  const where = {};
  if (filters.userId)          where.userId = filters.userId;
  if (filters.dominantStrategy) where.dominantStrategy = filters.dominantStrategy;

  return UserQuizResult.findAll({
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['userId', 'firstName', 'lastName', 'username'],
    }],
    order:  [['createdAt', 'DESC']],
    limit:  filters.limit  || 50,
    offset: filters.offset || 0,
  });
};

const getQuizResultById = async (id) => {
  const result = await UserQuizResult.findByPk(id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['userId', 'firstName', 'lastName', 'username'],
    }],
  });
  if (!result) throw new AppError('Quiz result not found', 404);
  return result;
};

const getQuizResultsByUser = async (userId, filters = {}) => {
  return UserQuizResult.findAll({
    where: { userId },
    order:  [['createdAt', 'DESC']],
    limit:  filters.limit  || 50,
    offset: filters.offset || 0,
  });
};

const getLatestQuizResultByUser = async (userId) => {
  return UserQuizResult.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

const updateQuizResult = async (id, data) => {
  const result = await UserQuizResult.findByPk(id);
  if (!result) throw new AppError('Quiz result not found', 404);
  return result.update(data);
};

const deleteQuizResult = async (id) => {
  const result = await UserQuizResult.findByPk(id);
  if (!result) throw new AppError('Quiz result not found', 404);
  await result.destroy();
  return { message: 'Quiz result deleted' };
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════
module.exports = {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getQuizResultsByUser,
  getLatestQuizResultByUser,
  updateQuizResult,
  deleteQuizResult,

  // Expose helpers untuk unit test
  _internal: {
    validateQuizPayload,
    calculateQuizResult,
    calculateXp,
    calculateStreak,
    aggregateScores,
    normalizeScores,
    classifyLevel,
    rankCategories,
    determineProfile,
    buildRecommendation,
  },
};